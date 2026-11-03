"""Local fake-service checks; never contacts Docker, Ollama or real render APIs."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('video_collector', HERE / 'collect_video_pilot.py')
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)
JOB = 'c38fdc34-8e0c-4409-a051-a92bbb21bb4c'


class Checks(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='collector-check-', dir=HERE)
        self.root = Path(self.temp.name)
        self.posts = 0
        self.fail_post = False
        self.missing_job = False
        self.polls = 0
        owner = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def send(self, data, code=200, content_type='application/json'):
                payload = json.dumps(data).encode() if content_type == 'application/json' else data
                self.send_response(code)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)

            def do_GET(self):
                if self.path.endswith('/health'):
                    self.send({'status': 'ok', 'version': 'fake'})
                elif self.path.endswith('/video'):
                    self.send(b'fake-video-for-transport-check', content_type='video/mp4')
                elif owner.missing_job:
                    self.send({'error': 'missing'}, code=404)
                else:
                    owner.polls += 1
                    self.send({'job_id': JOB, 'stage': 'completed', 'progress': 100})

            def do_POST(self):
                owner.posts += 1
                body = self.rfile.read(int(self.headers['Content-Length']))
                if b'filename="Main.java"' not in body:
                    self.send({'error': 'bad upload'}, 400)
                elif owner.fail_post:
                    self.send({'error': 'uncertain server error'}, 500)
                else:
                    self.send({'job_id': JOB, 'status': 'queued'}, 202)

        self.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.plan = self.root / 'plan.json'
        self.plan.write_text(json.dumps({'cases': [{'id': 'one', 'filename': 'Main.java',
                                                    'code': 'class Main {}'}]}))
        self.base = f'http://127.0.0.1:{self.server.server_port}/api'
        self.out = self.root / 'out'

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        if self.root.resolve().parent != HERE.resolve():
            raise RuntimeError('Refusing cleanup outside the evaluation folder')
        self.temp.cleanup()

    def run_collector(self, *extra):
        return subprocess.run([sys.executable, str(HERE / 'collect_video_pilot.py'),
                               '--plan', str(self.plan), '--out', str(self.out),
                               '--base-url', self.base, '--poll-seconds', '0.001',
                               '--max-wait', '1', *extra], capture_output=True, text=True, timeout=10)

    def test_preflight_never_submits(self):
        result = self.run_collector()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.posts, 0)
        self.assertFalse(self.out.exists())

    def test_download_and_resume_do_not_duplicate(self):
        first = self.run_collector('--run')
        self.assertEqual(first.returncode, 0, first.stderr)
        state = json.loads((self.out / 'one.json').read_text())
        self.assertEqual(state['status'], 'downloaded')
        self.assertEqual(state['artifact']['visual_correctness'], 'not assessed')
        self.assertEqual(self.run_collector('--run').returncode, 0)
        self.assertEqual(self.posts, 1)

    def test_uncertain_post_never_retries(self):
        self.fail_post = True
        self.assertNotEqual(self.run_collector('--run').returncode, 0)
        self.assertNotEqual(self.run_collector('--run').returncode, 0)
        self.assertEqual(self.posts, 1)
        self.assertEqual(json.loads((self.out / 'one.json').read_text())['status'], 'submission_uncertain')
        self.fail_post = False
        attached = self.run_collector('--run', '--attach', 'one', JOB)
        self.assertEqual(attached.returncode, 0, attached.stderr)
        self.assertEqual(self.posts, 1)

    def test_changed_plan_refuses_resume(self):
        self.assertEqual(self.run_collector('--run').returncode, 0)
        plan = json.loads(self.plan.read_text())
        plan['cases'][0]['code'] = 'class Changed {}'
        self.plan.write_text(json.dumps(plan))
        self.assertNotEqual(self.run_collector('--run').returncode, 0)
        self.assertEqual(self.posts, 1)

    def test_missing_job_stops_without_resubmission(self):
        self.missing_job = True
        self.assertNotEqual(self.run_collector('--run').returncode, 0)
        self.assertNotEqual(self.run_collector('--run').returncode, 0)
        self.assertEqual(self.posts, 1)


if __name__ == '__main__':
    unittest.main()
