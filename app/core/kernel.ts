/**
 * kernel app
 */
export const Kernel = [
    () => import("../router/register.route"),
    () => import("../app"),
    () => import("../../config/database.config")
];