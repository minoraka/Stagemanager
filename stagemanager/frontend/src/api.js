import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const isLogin = error.config?.url?.includes("auth/token");
    if (error.response?.status === 401 && !isLogin) {
      localStorage.removeItem("access");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/** Превращает ответ DRF с ошибками в читаемую строку. */
export function errText(e) {
  const d = e?.response?.data;
  if (!d) return "Нет связи с сервером.";
  if (typeof d === "string") return "Ошибка сервера.";
  if (d.detail) return d.detail;
  return Object.values(d).flat().join(" ");
}

export const STATUS = {
  draft: "Черновик",
  confirmed: "Подтверждено",
  completed: "Завершено",
  cancelled: "Отменено",
};
export const KINDS = { light: "Свет", sound: "Звук", stage: "Сцена и коммутация", other: "Прочее" };
export const ROLES = { admin: "Администратор", manager: "Менеджер", technician: "Технарь" };

export const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
export const fmtRange = (a, b) => (a === b ? fmtDate(a) : `${fmtDate(a)} — ${fmtDate(b)}`);

export default api;
