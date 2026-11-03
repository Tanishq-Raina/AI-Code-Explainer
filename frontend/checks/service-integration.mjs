import test from 'node:test';
import assert from 'node:assert/strict';
import API, { submitCode, executeCode, requestHint, getStudyTopicContent } from '../src/api/client.js';
import { HINT_TIMEOUT_MS, requestErrorMessage } from '../src/api/config.js';
import { videoAPI, createVideoJob, videoUrlForJob, watchVideoJob } from '../src/api/videoClient.js';

const reply = (config, data) => ({ data, status: 200, statusText: 'OK', headers: {}, config });

test('local hint routes allow both model attempts; execution keeps its short timeout', async () => {
  const seen = [];
  API.defaults.adapter = async (config) => { seen.push(config); return reply(config, { data: {} }); };
  await submitCode({ code: 'synthetic' });
  await requestHint({ code: 'synthetic' });
  await getStudyTopicContent('arrays');
  await executeCode({ code: 'synthetic' });
  assert.deepEqual(seen.map(c => c.timeout), [HINT_TIMEOUT_MS, HINT_TIMEOUT_MS, HINT_TIMEOUT_MS, 45_000]);
  assert.equal(seen[0].baseURL, 'http://localhost:5000/api');
});

test('video submission and playback use the same proxy and preserve the upload', async () => {
  let captured;
  videoAPI.defaults.adapter = async config => { captured = config; return reply(config, { data: { job_id: 'job-1' } }); };
  assert.equal(await createVideoJob('class Main {}', 'Main.java', 'low'), 'job-1');
  assert.equal(captured.baseURL, '/render-api');
  assert.equal(captured.url, '/render');
  assert.equal(captured.data.get('file').name, 'Main.java');
  assert.equal(await captured.data.get('file').text(), 'class Main {}');
  assert.equal(captured.data.get('quality'), 'low');
  assert.equal(videoUrlForJob('a/b'), '/render-api/jobs/a%2Fb/video');
});

test('a lost submission response never causes an automatic second render', async () => {
  let calls = 0;
  videoAPI.defaults.adapter = async () => { calls++; throw new Error('lost response'); };
  await assert.rejects(createVideoJob('class Main {}', 'Main.java', 'low'));
  assert.equal(calls, 1);
});

async function simulate(results, stopImmediately = false) {
  const events = [], timers = [];
  let requests = 0;
  const stop = watchVideoJob('job-1', {
    onProgress: job => events.push(['progress', job.stage]),
    onComplete: url => events.push(['complete', url]),
    onFailure: message => events.push(['failed', message]),
    onConnectionIssue: () => events.push(['reconnecting']),
  }, {
    getJob: async () => {
      requests++;
      const result = results.shift();
      if (result instanceof Error) throw result;
      return result;
    },
    schedule: fn => { timers.push(fn); return fn; },
    cancel: fn => { const i = timers.indexOf(fn); if (i >= 0) timers.splice(i, 1); },
  });
  if (stopImmediately) stop();
  await new Promise(resolve => setImmediate(resolve));
  let limit = 10;
  while (timers.length && limit--) {
    await timers.shift()();
  }
  stop();
  return { events, requests };
}

test('actual stage-only server schema reaches completion', async () => {
  const { events, requests } = await simulate([
    { job_id: 'job-1', stage: 'rendering', progress: 50 },
    { job_id: 'job-1', stage: 'completed', video_url: '/api/jobs/job-1/video' },
  ]);
  assert.equal(requests, 2);
  assert.deepEqual(events.at(-1), ['complete', '/render-api/jobs/job-1/video']);
});

test('actual stage-only failure displays the server diagnostic', async () => {
  const { events, requests } = await simulate([{ stage: 'failed', error_message: 'Audio validation failed' }]);
  assert.equal(requests, 1);
  assert.deepEqual(events.at(-1), ['failed', 'Audio validation failed']);
});

test('temporary disconnection resumes the same job without another submission', async () => {
  const error = Object.assign(new Error('offline'), { isAxiosError: true });
  const { events, requests } = await simulate([error, { stage: 'completed' }]);
  assert.equal(requests, 2);
  assert.deepEqual(events[0], ['reconnecting']);
  assert.equal(events.at(-1)[0], 'complete');
});

test('missing jobs stop polling with an explanation', async () => {
  const error = Object.assign(new Error('missing'), { isAxiosError: true, response: { status: 404 } });
  const { events, requests } = await simulate([error]);
  assert.equal(requests, 1);
  assert.match(events.at(-1)[1], /no longer available/);
});

test('a different job is rejected', async () => {
  const { events } = await simulate([{ stage: 'completed', job_id: 'other-job' }]);
  assert.deepEqual(events, [['failed', 'The video service returned a different job.']]);
});

test('unmount cancels callbacks from an outstanding status request', async () => {
  const { events } = await simulate([{ stage: 'completed' }], true);
  assert.deepEqual(events, []);
});

test('timeouts explain that processing may continue instead of claiming a connection failure', () => {
  assert.match(requestErrorMessage({ code: 'ECONNABORTED' }), /still be processing/);
  assert.equal(requestErrorMessage({ response: { data: { error: { message: 'specific failure' } } } }), 'specific failure');
});
