/**
 * Функция для показа уведомления
 */
interface ShowNotificationOpts {
  type?: "success" | "error";
}

const NotificationDefaultOpts: ShowNotificationOpts = {
  type: "success",
};
export function showNotification(
  message: string,
  opts: ShowNotificationOpts = NotificationDefaultOpts,
): void {
  // TODO color scheme
  const isError = opts?.type == "error";
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.position = "fixed";
  notification.style.bottom = "20px";
  notification.style.right = "20px";
  notification.style.backgroundColor = isError ? "#f44336" : "#4caf50";
  notification.style.color = "white";
  notification.style.padding = "10px 20px";
  notification.style.borderRadius = "5px";
  notification.style.zIndex = "10000";
  notification.style.fontFamily = "sans-serif";
  notification.style.fontSize = "14px";
  notification.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
  notification.style.opacity = "0";
  notification.style.transition = "opacity 0.3s";
  document.body.appendChild(notification);

  // Force reflow to ensure transition works
  notification.getBoundingClientRect();

  setTimeout(() => {
    notification.style.opacity = "1";
  }, 10);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}
