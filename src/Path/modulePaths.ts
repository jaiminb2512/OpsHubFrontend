export const MODULE_PATHS = {
    LIST: '/module',
    /** Create module — Module Setup Wizard (step 1 + step 2). */
    CREATE: '/module/create',
    EDIT: '/module/edit/:id',
    /** Bulk edit multiple modules' API/permission/menu setup via one combined JSON. Pass `?ids=id1,id2,...` */
    EDIT_BULK: '/module/edit/bulk',
    /** Alias for CREATE (same wizard). */
    WIZARD: '/module/create',
};
