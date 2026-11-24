class AppError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(message)


class AIProviderError(Exception):
    """Base class for provider errors safe to translate at the API boundary."""


class AIProviderUnavailable(AIProviderError):
    pass


class AIProviderRateLimited(AIProviderError):
    pass
