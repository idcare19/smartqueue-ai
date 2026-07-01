from channels.auth import AuthMiddlewareStack


def SmartQueueAuthMiddlewareStack(inner):
    return AuthMiddlewareStack(inner)

