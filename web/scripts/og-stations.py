"""Station Open Graph cards. Drawing lives in og-explain.py (question + diagram + invite, zh and en)."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('og-explain.py')), run_name='__main__')
