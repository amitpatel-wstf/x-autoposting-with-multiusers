import os
import tempfile
import mimetypes
import requests
from typing import Tuple


def download_to_temp(url: str) -> Tuple[str, str]:
    resp = requests.get(url, stream=True, timeout=30)
    resp.raise_for_status()
    # Infer extension from content-type
    ctype = resp.headers.get("Content-Type", "application/octet-stream").split(";")[0].strip()
    ext = mimetypes.guess_extension(ctype) or ""
    fd, path = tempfile.mkstemp(prefix="media_", suffix=ext or None)
    with os.fdopen(fd, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
    return path, ctype
