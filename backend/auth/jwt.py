import uuid
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import get_settings

settings = get_settings()
bearer = HTTPBearer()

# Create Token :
def create_access_token(user_id : uuid.UUID ) -> str:
    payload ={
        "sub": str(user_id),
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes = settings.JWT_EXPIRE_MINUTES)
    }

    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm = settings.JWT_ALGORITHM)

# Verify Token : 
def verify_access_token(token : str) -> uuid.UUID:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms = [settings.JWT_ALGORITHM])
        user_id : str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code = status.HTTP_401_UNAUTHORIZED,
                detail = "Invalid token",
                headers = {"WWW-Authenticate": "Bearer"}
            )
        return uuid.UUID(user_id)
    except JWTError:
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Invalid token",
            headers = {"WWW-Authenticate": "Bearer"}
        )

# Dependency to get current user from token :
def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False))) -> uuid.UUID:
    token = None
    if credentials:
        token = credentials.credentials
    elif "access_token" in request.cookies:
        token = request.cookies["access_token"]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return verify_access_token(token)