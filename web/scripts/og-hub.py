"""News and tool Open Graph cards. Drawing lives in og-explain.py (zh and en are separate files)."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('og-explain.py')), run_name='__main__')
