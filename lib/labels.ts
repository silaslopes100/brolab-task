export const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001"

export function resolveWorkspaceId(requested?: string | null): string {
  return requested && requested.trim() ? requested.trim() : DEFAULT_WORKSPACE_ID
}
