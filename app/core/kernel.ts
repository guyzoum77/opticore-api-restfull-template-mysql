/**
 * kernel app
 */
export const Kernel = () => {
    return [
        () => import("../router/register.route"),
        () => import("../app"),
        () => import("../../config/database.config")
    ];
}