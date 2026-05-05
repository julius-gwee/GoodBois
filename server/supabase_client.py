import os

from supabase import Client, create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY: str = os.environ["SUPABASE_ANON_KEY"]
SUPABASE_SERVICE_ROLE_KEY: str = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# Admin client (service role key) — server-side only, NEVER expose to the browser.
# Used for privileged operations such as sending magic links.
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Standard anon client — used for non-privileged queries that respect Row Level Security.
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
