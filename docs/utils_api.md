# Reusable util functions

Common utilities available for userscripts. Import these instead of reimplementing.

## Notification

Show a toast notification at the bottom-right corner. Auto-dismisses after 2 seconds.

```ts
import { showNotification } from "@app/utils/ui/notification";
```

**Signature:** `showNotification(message: string, opts?: { type?: "success" | "error" })`

**Example:**
```ts
showNotification("Saved!");
showNotification("Something went wrong", { type: "error" });
```

**Default:** type is `"success"` if omitted.

## Error handling

Safely extract a string message from any error value.

```ts
import { getErrorMessage } from "@app/utils/error";
```

**Signature:** `getErrorMessage(error: unknown): string`

**Example:**
```ts
try {
  // ...
} catch (err) {
  showNotification(getErrorMessage(err), { type: "error" });
}
```

**Behavior:** returns `error.message` if Error instance, otherwise `String(error)`.
