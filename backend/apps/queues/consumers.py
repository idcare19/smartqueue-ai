import json
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.accounts.models import UserRole


class QueueConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.scope_user = await self.get_user()
        self.groups_to_join = set()
        params = parse_qs(self.scope["query_string"].decode())

        stream = self.scope["url_route"]["kwargs"].get("stream", "organization")
        identifier = self.scope["url_route"]["kwargs"].get("identifier", "")

        if stream == "public":
            self.groups_to_join.add("public_display")
        elif stream == "customer":
            self.groups_to_join.add(f"customer_{identifier.lower()}")
        else:
            if not self.scope_user:
                await self.close(code=4401)
                return

            if stream == "organization":
                if await self.can_access_organization(identifier):
                    self.groups_to_join.add(f"organization_{identifier}")
            elif stream == "branch":
                if await self.can_access_branch(identifier):
                    self.groups_to_join.add(f"branch_{identifier}")
            elif stream == "counter":
                if await self.can_access_counter(identifier):
                    self.groups_to_join.add(f"counter_{identifier}")
            elif stream == "staff":
                branch_id = params.get("branch", [None])[0] or getattr(self.scope_user, "branch_id", None)
                if branch_id and await self.can_access_branch(str(branch_id)):
                    self.groups_to_join.add(f"branch_{branch_id}")

        if not self.groups_to_join:
            await self.close(code=4403)
            return

        for group in self.groups_to_join:
            await self.channel_layer.group_add(group, self.channel_name)

        await self.accept()
        await self.send_json({"event": "connection.ready", "groups": list(self.groups_to_join)})

    async def disconnect(self, code):
        for group in getattr(self, "groups_to_join", set()):
            await self.channel_layer.group_discard(group, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        return

    async def queue_event(self, event):
        await self.send_json(event["payload"])

    async def send_json(self, payload):
        await self.send(text_data=json.dumps(payload))

    @database_sync_to_async
    def get_user(self):
        query_string = self.scope["query_string"].decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]
        if not token:
            return None
        authenticator = JWTAuthentication()
        validated = authenticator.get_validated_token(token)
        return authenticator.get_user(validated)

    @database_sync_to_async
    def can_access_organization(self, organization_id: str):
        user = self.scope_user
        if not user:
            return False
        if user.is_superuser or user.role == UserRole.SUPER_ADMIN:
            return True
        return str(user.organization_id or "") == organization_id

    @database_sync_to_async
    def can_access_branch(self, branch_id: str):
        user = self.scope_user
        if not user:
            return False
        if user.is_superuser or user.role == UserRole.SUPER_ADMIN:
            return True
        if user.role == UserRole.ORGANIZATION_ADMIN:
            return True
        return str(user.branch_id or "") == branch_id

    @database_sync_to_async
    def can_access_counter(self, counter_id: str):
        user = self.scope_user
        if not user:
            return False
        if user.is_superuser or user.role in {UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.BRANCH_MANAGER}:
            return True
        return user.assigned_counters.filter(id=counter_id).exists()

