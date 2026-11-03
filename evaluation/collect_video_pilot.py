"""Sequential, resumable Render API collector. Standard library only.

This collects DEVELOPMENT/PILOT evidence; it does not score visual correctness.
No jobs are submitted unless --run is supplied. See VIDEO_PILOT.md.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import sys
import time
from datetime import datetime, timezone
from urllib import error, request
import uuid

HERE = Path(__file__).resolve().parent


def now():
    return datetime.now(timezone.utc).isoformat()


def digest(value):
    return hashlib.sha256(value).hexdigest()


def atomic_json(path, value):
    temporary = path.with_suffix(path.suffix + '.tmp')
    with temporary.open('w', encoding='utf-8') as stream:
        json.dump(value, stream, indent=2, ensure_ascii=False)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temporary, path)


def append_event(folder, kind, **data):
    with (folder / 'events.jsonl').open('a', encoding='utf-8') as stream:
        stream.write(json.dumps({'at': now(), 'event': kind, **data}) + '\n')
        stream.flush()
        os.fsync(stream.fileno())


def http_json(url, timeout=30, body=None, content_type=None):
    req = request.Request(url, data=body, headers=(
        {'Content-Type': content_type} if content_type else {}))
    with request.urlopen(req, timeout=timeout) as response:
        return response.status, json.load(response)


def unwrap(value):
    if isinstance(value, dict) and isinstance(value.get('data'), dict):
        return value['data']
    return value


def multipart(case, quality):
    boundary = 'pilot-' + uuid.uuid4().hex
    chunks = []
    for key, value in [('quality', quality), ('inputs', ' '.join(case.get('inputs', [])))]:
        chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode())
    chunks.append((f'--{boundary}\r\nContent-Disposition: form-data; name="file"; '
                   f'filename="{case["filename"]}"\r\nContent-Type: text/x-java\r\n\r\n').encode())
    chunks.extend([case['code'].encode('utf-8'), f'\r\n--{boundary}--\r\n'.encode()])
    return b''.join(chunks), f'multipart/form-data; boundary={boundary}'


def load_plan(path):
    plan = json.loads(path.read_text(encoding='utf-8'))
    ids = set()
    for case in plan['cases']:
        identifier = case['id']
        if not identifier or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-' for c in identifier):
            raise ValueError('Case IDs must use letters, numbers, underscore or hyphen')
        if identifier in ids:
            raise ValueError('Duplicate case ID')
        ids.add(identifier)
        filename = case['filename']
        if Path(filename).name != filename or not filename.endswith('.java') or any(c in filename for c in '\r\n"/\\'):
            raise ValueError('Unsafe Java filename')
        if not case['code'].strip():
            raise ValueError('Empty source')
    if not ids:
        raise ValueError('No cases')
    return plan


def initialize(folder, plan, base, quality, metadata):
    contract = {'plan': plan, 'base_url': base, 'quality': quality,
                'declared_service_configuration': metadata,
                'collector_sha256': digest(Path(__file__).read_bytes())}
    fingerprint = digest(json.dumps(contract, sort_keys=True).encode())
    path = folder / 'manifest.json'
    if path.exists():
        if json.loads(path.read_text(encoding='utf-8'))['fingerprint'] != fingerprint:
            raise ValueError('Configuration or collector changed; use a NEW output directory')
    else:
        atomic_json(path, {'fingerprint': fingerprint, 'created_at': now(),
                          'python': sys.version, 'platform': platform.platform(),
                          'purpose': plan.get('purpose', 'unspecified collection'), **contract})
    return fingerprint


def check_service(base):
    _, raw = http_json(base + '/health')
    health = unwrap(raw)
    if health.get('status') != 'ok' or 'version' not in health:
        raise ValueError('Endpoint does not identify as this Render API; check port mapping')
    return raw


def download(base, job_id, target):
    # Always derive the URL from the configured service, not a response URL.
    temporary = target.with_suffix('.mp4.part')
    with request.urlopen(base + '/jobs/' + job_id + '/video', timeout=300) as response:
        if 'video/mp4' not in response.headers.get('Content-Type', ''):
            raise ValueError('Video endpoint did not return video/mp4')
        expected = response.headers.get('Content-Length')
        with temporary.open('wb') as stream:
            while chunk := response.read(1024 * 1024):
                stream.write(chunk)
        length = temporary.stat().st_size
        if not length or (expected is not None and length != int(expected)):
            raise ValueError('Empty or incomplete video download')
    os.replace(temporary, target)
    sha = hashlib.sha256()
    with target.open('rb') as stream:
        while chunk := stream.read(1024 * 1024):
            sha.update(chunk)
    return {'bytes': length, 'sha256': sha.hexdigest(), 'path': target.name,
            'visual_correctness': 'not assessed', 'media_decode': 'not checked'}


def collect_case(folder, case, base, quality, args):
    path = folder / (case['id'] + '.json')
    state = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'case_id': case['id'], 'status': 'new'}

    def save():
        atomic_json(path, state)

    if args.attach and args.attach[0] == case['id']:
        if state.get('job_id') or state['status'] in ('downloaded', 'failed', 'rejected'):
            raise ValueError('Cannot attach over an existing known job or terminal result')
        # Validate UUID before using it in a request path.
        state.update(job_id=str(uuid.UUID(args.attach[1])), status='submitted',
                     manually_attached_at=now(), started_epoch=state.get('started_epoch', time.time()))
        save()
        append_event(folder, 'manual_attach', case_id=case['id'], job_id=state['job_id'])
    if state['status'] in ('downloaded', 'failed', 'rejected'):
        print(case['id'], 'already', state['status'], flush=True)
        return
    if not state.get('job_id'):
        if state['status'] != 'new':
            raise RuntimeError(f'{case["id"]}: uncertain submission. Do not resubmit automatically. See VIDEO_PILOT.md')
        body, content_type = multipart(case, quality)
        state.update(status='submitting', started_at=now(), started_epoch=time.time())
        save()  # Durable intent BEFORE the non-idempotent POST.
        append_event(folder, 'submission_intent', case_id=case['id'])
        try:
            code, raw = http_json(base + '/render', timeout=args.request_timeout,
                                  body=body, content_type=content_type)
            atomic_json(folder / (case['id'] + '.submission.json'), raw)
            payload = unwrap(raw)
            if code != 202 or not payload.get('job_id'):
                raise ValueError('Unexpected render acknowledgement')
            job_id = str(uuid.UUID(payload['job_id']))
            state.update(status='submitted', job_id=job_id, acknowledged_at=now())
            save()
            append_event(folder, 'submitted', case_id=case['id'], job_id=job_id)
        except error.HTTPError as exc:
            # Even a server error can follow enqueueing; never assume it is safe to retry.
            state.update(status='submission_uncertain', http_status=exc.code,
                         response=exc.read().decode('utf-8', errors='replace'))
            save()
            raise RuntimeError('Submission HTTP error saved; reconcile before resubmitting') from exc
        except Exception as exc:
            state.update(status='submission_uncertain', error=str(exc))
            save()
            raise

    print(case['id'], 'polling', state['job_id'], flush=True)
    errors = 0
    deadline = time.monotonic() + args.max_wait
    while time.monotonic() < deadline:
        try:
            _, raw = http_json(base + '/jobs/' + state['job_id'], timeout=args.request_timeout)
            payload = unwrap(raw)
        except error.HTTPError as exc:
            append_event(folder, 'poll_http_error', case_id=case['id'], http_status=exc.code)
            if exc.code in (404, 410):
                state.update(status='job_missing', error='Server lost job or artifacts; possible container restart')
                save()
                raise RuntimeError('Known job missing; queue stopped without resubmitting') from exc
            errors += 1
        except (OSError, ValueError) as exc:
            errors += 1
            append_event(folder, 'poll_error', case_id=case['id'], error=str(exc))
        else:
            errors = 0
            stage = payload.get('stage') or payload.get('status')
            if stage != state.get('last_stage'):
                print(case['id'], stage, flush=True)
            append_event(folder, 'poll', case_id=case['id'], response=raw)
            state.update(last_stage=stage, last_response=raw, last_observed_at=now())
            if stage == 'failed':
                state.update(status='failed', elapsed_wall_seconds=time.time() - state['started_epoch'])
                save()
                return
            if stage == 'completed':
                state.update(status='render_completed', completion_observed_at=now(),
                             elapsed_wall_seconds=time.time() - state['started_epoch'])
                save()
                state['artifact'] = download(base, state['job_id'], folder / (case['id'] + '.mp4'))
                state.update(status='downloaded', downloaded_at=now())
                save()
                append_event(folder, 'downloaded', case_id=case['id'], artifact=state['artifact'])
                return
            state['status'] = 'polling'
            save()
        if errors >= 5:
            raise RuntimeError('Five consecutive polling errors; rerun later to resume the same job')
        time.sleep(args.poll_seconds)
    append_event(folder, 'wait_limit', case_id=case['id'], job_id=state['job_id'])
    raise RuntimeError('Wait limit reached; job was NOT cancelled. Rerun to resume polling')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', type=Path, default=HERE / 'video_pilot_plan.json')
    parser.add_argument('--out', type=Path, default=HERE / 'runs' / 'video-pilot')
    parser.add_argument('--base-url', default='http://localhost:4000/api')
    parser.add_argument('--quality', choices=['low', 'medium', 'high', 'production', '4k'], default='low')
    parser.add_argument('--metadata', type=Path, help='JSON describing the actual container/model/TTS settings; never include keys')
    parser.add_argument('--run', action='store_true', help='Actually submit and poll pilot jobs')
    parser.add_argument('--attach', nargs=2, metavar=('CASE_ID', 'JOB_UUID'))
    parser.add_argument('--poll-seconds', type=float, default=10)
    parser.add_argument('--request-timeout', type=float, default=60)
    parser.add_argument('--max-wait', type=float, default=7200, help='Polling budget per case per invocation')
    args = parser.parse_args()
    if min(args.poll_seconds, args.request_timeout, args.max_wait) <= 0:
        parser.error('Timeouts and polling interval must be positive')
    plan = load_plan(args.plan)
    if args.attach and args.attach[0] not in {case['id'] for case in plan['cases']}:
        parser.error('Unknown attach case')
    base = args.base_url.rstrip('/')
    health = check_service(base)
    print('Render API health:', json.dumps(health), flush=True)
    print('Pilot cases:', len(plan['cases']), '| sequential |', args.quality, flush=True)
    if not args.run:
        print('Read-only preflight complete. No render jobs submitted. Add --run to collect.')
        return
    args.out.mkdir(parents=True, exist_ok=True)
    # OS-held lock is released even on crash; prevents duplicate collectors.
    with (args.out / 'collector.lock').open('a+b') as lock:
        lock.seek(0)
        if lock.read(1) == b'':
            lock.write(b'0')
            lock.flush()
        lock.seek(0)
        if os.name == 'nt':
            import msvcrt
            msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        metadata = json.loads(args.metadata.read_text(encoding='utf-8')) if args.metadata else {
            'verification': 'NOT PROVIDED: actual video model, provider, TTS and image must be recorded separately'}
        initialize(args.out, plan, base, args.quality, metadata)
        append_event(args.out, 'invocation', health=health)
        for case in plan['cases']:
            collect_case(args.out, case, base, args.quality, args)
        print('Pilot queue complete. Inspect JSON and MP4 files in', args.out.resolve())


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\nStopped locally. Submitted jobs were not cancelled; rerun to resume.', file=sys.stderr)
        sys.exit(130)
    except Exception as exc:
        print(f'STOPPED: {exc}', file=sys.stderr)
        sys.exit(1)
