from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from supabase_client import supabase

router = APIRouter()


class SendMagicLinkRequest(BaseModel):
    email: EmailStr
    redirect_to: str


@router.post("/send-magic-link")
def send_magic_link(body: SendMagicLinkRequest) -> dict:
    """
    Send a magic-link (OTP) email via Supabase Auth.

    The Next.js frontend proxies to this endpoint — the browser never touches
    Supabase directly.
    """
    response = supabase.auth.sign_in_with_otp(
        {
            "email": body.email,
            "options": {"email_redirect_to": body.redirect_to},
        }
    )
    if response.user is None and response.session is None:
        # OTP sent successfully — user and session are None until the link is clicked.
        return {"message": "Magic link sent"}

    # Unexpected state
    raise HTTPException(status_code=500, detail="Unexpected auth response")
