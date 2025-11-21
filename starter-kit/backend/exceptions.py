"""Custom exception classes."""


class AuthenticationError(Exception):
    """Raised when authentication fails."""
    pass


class AuthorizationError(Exception):
    """Raised when user lacks required permissions."""
    pass


class NotFoundError(Exception):
    """Raised when a resource is not found."""
    pass


class ValidationError(Exception):
    """Raised when input validation fails."""
    pass
