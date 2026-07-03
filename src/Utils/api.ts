const NODEJS_BASE_URL = import.meta.env.VITE_NODEJS_BASE_URL;

interface EndpointConfig {
    path: string;
    method: string;
    baseUrl: string;
}

interface ApiConfig {
    endpoints: Record<string, EndpointConfig>;
}

interface ApiConfigResult {
    url: string;
    method: string;
    baseUrl: string;
}

export const API_CONFIG: ApiConfig = {
    endpoints: {
        // ============================================
        // AUTHENTICATION ENDPOINTS
        // ============================================
        login: {
            path: '/users/login',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        logout: {
            path: '/auth/logout',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        register: {
            path: '/users',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },


        // ============================================
        // DASHBOARD ENDPOINTS
        // ============================================
        getOwnerDashboard: {
            path: '/dashboard/owner',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },


        // ============================================
        // SUPPLIER ENDPOINTS
        // ============================================
        getSuppliers: {
            path: '/suppliers',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getSupplierById: {
            path: '/suppliers/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createSupplier: {
            path: '/suppliers',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateSupplier: {
            path: '/suppliers/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteSupplier: {
            path: '/suppliers/{id}/delete',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        activateSupplier: {
            path: '/suppliers/{id}/activate',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        getSupplierLedger: {
            path: '/suppliers/{id}/ledger',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getSupplierPurchaseOrders: {
            path: '/suppliers/{id}/purchase-orders',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        addLedgerAdjustment: {
            path: '/suppliers/{id}/ledger/adjustment',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // USER ENDPOINTS
        // ============================================
        getMe: {
            path: '/users/me',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getMyRoleContexts: {
            path: '/users/me/role-contexts',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        changePassword: {
            path: '/users/change-password',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        resetPassword: {
            path: '/users/reset-password/{userId}',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        getUserRoles: {
            path: '/users/roles',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getUsers: {
            path: '/users',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getUserById: {
            path: '/users/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        updateUser: {
            path: '/users/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteUser: {
            path: '/users/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        getExternalUsers: {
            path: '/users/external',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        fillExternalUsers: {
            path: '/users/fill-external',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // ROLE ENDPOINTS
        // ============================================
        getRoles: {
            path: '/roles',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getRoleById: {
            path: '/roles/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createRole: {
            path: '/roles',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateRole: {
            path: '/roles/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteRole: {
            path: '/roles/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        getRolesPermissions: {
            path: '/roles/permissions',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        roleSetupGetModules: {
            path: '/roles/get-modules',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        roleSetupModuleDetailByName: {
            path: '/roles/module-detail-by-name/{name}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        roleWizardGetModuleGroups: {
            path: '/roles/wizard/module-groups',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        roleWizardGetModules: {
            path: '/roles/wizard/modules',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        removePermissionsByModuleAndRole: {
            path: '/roles/remove-by-module-role',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        getRolePermissions: {
            path: '/roles/{roleId}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },

        // PERMISSION ENDPOINTS
        getPermissions: {
            path: '/permissions',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createPermission: {
            path: '/permissions',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        createPermissionWithMenu: {
            path: '/permissions/with-menu',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        deletePermission: {
            path: '/permissions/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        checkEndpointPermissions: {
            path: '/permissions/check-endpoints',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // API ENDPOINTS
        // ============================================
        getApiEndpoints: {
            path: '/api-endpoints',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getApiEndpointById: {
            path: '/api-endpoints/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createApiEndpoint: {
            path: '/api-endpoints',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateApiEndpoint: {
            path: '/api-endpoints/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteApiEndpoint: {
            path: '/api-endpoints/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // FEATURE ENDPOINTS
        // ============================================
        getFeatures: {
            path: '/features',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getFeatureById: {
            path: '/features/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createFeature: {
            path: '/features',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateFeature: {
            path: '/features/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteFeature: {
            path: '/features/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // FEATURE MODULE ENDPOINTS
        // ============================================
        getFeatureModules: {
            path: '/feature-modules',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getFeatureModuleById: {
            path: '/feature-modules/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createFeatureModule: {
            path: '/feature-modules',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        syncFeatureModules: {
            path: '/feature-modules/sync',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteFeatureModule: {
            path: '/feature-modules/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // PROJECT ENDPOINTS
        // ============================================
        getProjects: {
            path: '/projects',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getProjectById: {
            path: '/projects/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createProject: {
            path: '/projects',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateProject: {
            path: '/projects/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteProject: {
            path: '/projects/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        hardDeleteProject: {
            path: '/import/project/{id}/hard-delete',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ── Project API Keys ──
        listProjectApiKeys: {
            path: '/projects/{projectId}/api-keys',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createProjectApiKey: {
            path: '/projects/{projectId}/api-keys',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        toggleProjectApiKey: {
            path: '/projects/{projectId}/api-keys/{keyId}',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteProjectApiKey: {
            path: '/projects/{projectId}/api-keys/{keyId}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // MODULE GROUP ENDPOINTS
        // ============================================
        getModuleGroups: {
            path: '/module-groups',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getAllModuleGroups: {
            path: '/module-groups/all',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getAssignableModulesForGroup: {
            path: '/module-groups/assignable-modules',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getModuleGroupById: {
            path: '/module-groups/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createModuleGroup: {
            path: '/module-groups',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateModuleGroup: {
            path: '/module-groups/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteModuleGroup: {
            path: '/module-groups/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // MENU ENDPOINTS
        // ============================================
        getMyMenus: {
            path: '/menus/my-menus',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getMenus: {
            path: '/menus',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getMenuById: {
            path: '/menus/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createMenu: {
            path: '/menus',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateMenu: {
            path: '/menus/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteMenu: {
            path: '/menus/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        getMenuByRoleId: {
            path: '/menus/role/{roleId}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getMenuChildren: {
            path: '/menus/{id}/children',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // MODULE ENDPOINTS
        // ============================================
        getModules: {
            path: '/modules',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createModuleOnly: {
            path: '/modules',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        createBulkModules: {
            path: '/modules/module-permissions',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },

        saveFeatureApiPermissionMenuModuleSetUp: {
            path: '/modules/feature-api-permission-menu',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        moduleSetupCreateFeature: {
            path: '/modules/feature',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        moduleSetupWizardDetails: {
            path: '/modules/module-wizard-details/{moduleId}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // COMPANIES
        // ============================================
        listCompanies: {
            path: '/companies',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getCompanyById: {
            path: '/companies/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getCompanyLimitsUsage: {
            path: '/companies/{id}/limits-usage',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createCompany: {
            path: '/companies',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateCompany: {
            path: '/companies/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteCompany: {
            path: '/companies/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        hardDeleteCompany: {
            path: '/companies/{id}/hard',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        estimateCompanySubscription: {
            path: '/companies/{id}/estimate-subscription',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        subscribeCompany: {
            path: '/companies/{id}/subscribe',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        importCompanyRoles: {
            path: '/company-roles/{id}/import-roles',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        getCompanyPlanModules: {
            path: '/company-roles/{companyId}/plan-modules',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        // ── Stores & Warehouses ──
        getCompanyStoresWarehouses: {
            path: '/stores-warehouses/{companyId}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        saveCompanyStoresWarehouses: {
            path: '/stores-warehouses/{companyId}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        getCompanyStores: {
            path: '/stores-warehouses/{companyId}/stores',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createCompanyStore: {
            path: '/stores-warehouses/{companyId}/stores',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteCompanyStore: {
            path: '/stores-warehouses/{companyId}/stores/{storeId}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        updateCompanyStore: {
            path: '/stores-warehouses/{companyId}/stores/{storeId}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        getCompanyWarehouses: {
            path: '/stores-warehouses/{companyId}/warehouses',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createCompanyWarehouse: {
            path: '/stores-warehouses/{companyId}/warehouses',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteCompanyWarehouse: {
            path: '/stores-warehouses/{companyId}/warehouses/{warehouseId}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        updateCompanyWarehouse: {
            path: '/stores-warehouses/{companyId}/warehouses/{warehouseId}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },

        // ── Company Users ──
        getCompanyUserRoles: {
            path: '/company-roles',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getCompanyUsers: {
            path: '/company-users/{companyId}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createCompanyUser: {
            path: '/company-users/{companyId}',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateCompanyUser: {
            path: '/company-users/{companyId}/{userId}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },

        getCompanyUserRolesForCompany: {
            path: '/company-users/{companyId}/roles',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getCompanyUserDetail: {
            path: '/company-users/{companyId}/user/{userId}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },

        // ── User Mapping ──
        getUserAccessMapping: {
            path: '/company-users/{companyId}/{userId}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        saveUserAccessMapping: {
            path: '/company-users/update-user-mapping/{companyId}/{userId}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },

        // ── User ↔ multiple companies (UserRole mapping) ──
        getUserCompanyRoles: {
            path: '/company-users/get-company-user-roles/{userId}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        saveUserCompanyRoles: {
            path: '/company-users/update-user-company-role/{userId}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // PLANS
        // ============================================
        getPlans: {
            path: '/plans',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getPlanById: {
            path: '/plans/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createPlan: {
            path: '/plans',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updatePlan: {
            path: '/plans/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deletePlan: {
            path: '/plans/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        planWizardCompanies: {
            path: '/plans/wizard/companies',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        planWizardModules: {
            path: '/plans/wizard/modules',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        planWizardFeaturesSetup: {
            path: '/plans/wizard/features',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        planWizardLimitsSetup: {
            path: '/plans/wizard/limits-setup',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        planWizardComplete: {
            path: '/plans/wizard/complete',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        planWizardForEdit: {
            path: '/plans/wizard/{planId}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        planWizardPlanLimitsSetup: {
            path: '/plans/wizard/{planId}/limits-setup',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        planWizardSaveFeatures: {
            path: '/plans/wizard/{planId}/features',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        planWizardUpdate: {
            path: '/plans/wizard/{planId}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // SETUP WIZARD DRAFTS (type: plan | company | module)
        // ============================================
        listSetupDrafts: {
            path: '/setup-drafts',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createSetupDraft: {
            path: '/setup-drafts',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        getSetupDraftById: {
            path: '/setup-drafts/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        updateSetupDraft: {
            path: '/setup-drafts/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteSetupDraft: {
            path: '/setup-drafts/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // CUSTOMER ENDPOINTS
        // ============================================
        getCustomers: {
            path: '/customers',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getCustomerById: {
            path: '/customers/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createCustomer: {
            path: '/customers',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateCustomer: {
            path: '/customers/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteCustomer: {
            path: '/customers/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // MEASUREMENT ENDPOINTS
        // ============================================
        addMeasurement: {
            path: '/measurements',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        getCustomerMeasurements: {
            path: '/measurements/{customerId}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getSpecialMeasurements: {
            path: '/measurements/special',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        addSpecialMeasurement: {
            path: '/measurements/special',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        editMeasurement: {
            path: '/measurements',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // PRODUCT ENDPOINTS
        // ============================================
        getProducts: {
            path: '/products',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getProductById: {
            path: '/products/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createProduct: {
            path: '/products',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateProduct: {
            path: '/products/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteProduct: {
            path: '/products/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // PRODUCT VARIANT ENDPOINTS
        // ============================================
        getProductVariants: {
            path: '/productVariants',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getProductVariantById: {
            path: '/productVariants/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createProductVariant: {
            path: '/productVariants',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateProductVariant: {
            path: '/productVariants/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteProductVariant: {
            path: '/productVariants/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        addProductItemsToVariant: {
            path: '/productVariants/{id}/productItems',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        removeProductItemsFromVariant: {
            path: '/productVariants/{id}/productItems',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // PRODUCT ITEM ENDPOINTS
        // ============================================
        getProductItems: {
            path: '/productItems',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getProductItemById: {
            path: '/productItems/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createProductItem: {
            path: '/productItems',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateProductItem: {
            path: '/productItems/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteProductItem: {
            path: '/productItems/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // FABRIC INVENTORY ENDPOINTS
        // ============================================
        getFabricInventories: {
            path: '/fabric-inventories',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getFabricInventoryById: {
            path: '/fabric-inventories/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createFabricInventory: {
            path: '/fabric-inventories',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateFabricInventory: {
            path: '/fabric-inventories/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteFabricInventory: {
            path: '/fabric-inventories/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        // Ready-Made Inventory Endpoints
        getReadyMadeInventories: {
            path: '/ready-made-inventories',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getReadyMadeInventoryById: {
            path: '/ready-made-inventories/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createReadyMadeInventory: {
            path: '/ready-made-inventories',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateReadyMadeInventory: {
            path: '/ready-made-inventories/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteReadyMadeInventory: {
            path: '/ready-made-inventories/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        // Accessory Inventory Endpoints
        getAccessoryInventories: {
            path: '/accessory-inventories',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getAccessoryInventoryById: {
            path: '/accessory-inventories/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createAccessoryInventory: {
            path: '/accessory-inventories',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateAccessoryInventory: {
            path: '/accessory-inventories/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteAccessoryInventory: {
            path: '/accessory-inventories/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // PRODUCT ORDER ENDPOINTS
        // ============================================
        getBookedOrders: {
            path: '/productOrders',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getOrderDetails: {
            path: '/productOrders/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getPrintReceipt: {
            path: '/productOrders/{id}/print-receipt',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        bookOrder: {
            path: '/productOrders/book',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateProductOrder: {
            path: '/productOrders/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteProductOrder: {
            path: '/productOrders/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        getJobCardDetails: {
            path: '/productOrders/workpiece/{id}/job-card',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getAvailableReadyMadeItems: {
            path: '/productOrders/ready-made-items',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getOrderWorkPieces: {
            path: '/productOrders/{id}/workpieces',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getOrderItemWorkPieces: {
            path: '/productOrders/{id}/items/{itemId}/workpieces',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        recordOrderPayment: {
            path: '/order-payments',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        getAllOrderPayments: {
            path: '/order-payments',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getOrderPayments: {
            path: '/productOrders/{id}/payments',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        voidOrderPayment: {
            path: '/order-payments/{paymentId}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // ITEM STATUS ENDPOINTS
        // ============================================
        convertPendingToCutting: {
            path: '/itemStatuses/convert-pending-to-cutting',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // WORK PIECE ENDPOINTS
        // ============================================
        getWorkPieces: {
            path: '/workPieces',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        convertWorkPiecePendingToUnderCutting: {
            path: '/workPieces/{workpieceId}/convert-pending-to-under-cutting',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        convertWorkPieceUnderCuttingToReadyToStitch: {
            path: '/workPieces/{workpieceId}/convert-under-cutting-to-ready-to-stitch',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        convertWorkPieceReadyToStitchToUnderStitching: {
            path: '/workPieces/{workpieceId}/convert-ready-to-stitch-to-under-stitching',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        convertWorkPieceUnderStitchingToReadyToFinishing: {
            path: '/workPieces/{workpieceId}/convert-under-stitching-to-ready-to-finishing',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        convertWorkPieceReadyToFinishingToUnderFinishing: {
            path: '/workPieces/{workpieceId}/convert-ready-to-finishing-to-under-finishing',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        convertWorkPieceUnderFinishingToReadyToDeliver: {
            path: '/workPieces/{workpieceId}/convert-under-finishing-to-ready-to-deliver',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        getWorkPieceById: {
            path: '/workPieces/{workpieceId}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getWorkPieceStatusHistory: {
            path: '/workPieces/{workpieceId}/status-history',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getWorkPieceActions: {
            path: '/workPieces/{workpieceId}/actions',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        moveWorkPiece: {
            path: '/workPieces/{workpieceId}/move',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        rejectWorkPiece: {
            path: '/workPieces/{workpieceId}/reject',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        // ============================================
        // IMAGE ENDPOINTS
        // ============================================
        getImage: {
            path: '/images/{filename}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        // ============================================
        // PURCHASE ORDER ENDPOINTS
        // ============================================
        createPurchaseOrder: {
            path: '/purchase-orders',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        getAllPurchaseOrders: {
            path: '/purchase-orders',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getPurchaseOrderById: {
            path: '/purchase-orders/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        updatePurchaseOrder: {
            path: '/purchase-orders/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        cancelPurchaseOrder: {
            path: '/purchase-orders/{id}/cancel',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        receivePurchaseOrder: {
            path: '/purchase-orders/{id}/receive',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // SUPPLIER PAYMENT ENDPOINTS
        // ============================================
        createSupplierPayment: {
            path: '/supplier-payments',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        getAllSupplierPayments: {
            path: '/supplier-payments',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getSupplierPaymentById: {
            path: '/supplier-payments/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        reverseSupplierPayment: {
            path: '/supplier-payments/{id}/reverse',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // WORKFLOW ENDPOINTS
        // ============================================
        getAllWorkflows: {
            path: '/workflows',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getWorkflowById: {
            path: '/workflows/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        createWorkflow: {
            path: '/workflows',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        saveWorkflowStructure: {
            path: '/workflows/{id}/structure',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        updateWorkflow: {
            path: '/workflows/{id}',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteWorkflow: {
            path: '/workflows/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        importWorkflowToCompany: {
            path: '/workflows/{id}/import-to-company',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        hardDeleteWorkflow: {
            path: '/workflows/{id}/hard-delete',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // NOTIFICATION ENDPOINTS
        // ============================================
        getNotifications: {
            path: '/notifications',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        markNotificationRead: {
            path: '/notifications/{id}/read',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        markNotificationUnread: {
            path: '/notifications/{id}/unread',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },

        markAllNotificationsRead: {
            path: '/notifications/read-all',
            method: 'PATCH',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteNotification: {
            path: '/notifications/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        createNotification: {
            path: '/notifications',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // ATTENDANCE ENDPOINTS
        // ============================================
        getAttendance: {
            path: '/attendance',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getAttendanceSummary: {
            path: '/attendance/summary',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getAttendanceEmployees: {
            path: '/attendance/employees',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        markAttendance: {
            path: '/attendance/mark',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        markSelfAttendance: {
            path: '/attendance/mark-self',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        getMonthlyAttendance: {
            path: '/attendance/monthly',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        updateAttendance: {
            path: '/attendance/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteAttendance: {
            path: '/attendance/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        createAttendanceEmployee: {
            path: '/attendance/employees',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        updateAttendanceEmployee: {
            path: '/attendance/employees/{id}',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteAttendanceEmployee: {
            path: '/attendance/employees/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
        exportAttendance: {
            path: '/attendance/export',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },

        // Dashboard read-only attendance (JWT)
        getProjectAttendanceEmployees: {
            path: '/projects/{projectId}/attendance/employees',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getProjectAttendanceMonthly: {
            path: '/projects/{projectId}/attendance/monthly',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getProjectAttendanceSummary: {
            path: '/projects/{projectId}/attendance/summary',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getProjectAttendanceByDate: {
            path: '/projects/{projectId}/attendance',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // PROJECT STATS & STORAGE CONFIG
        // ============================================
        getProjectStats: {
            path: '/projects/{id}/stats',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getDashboardStats: {
            path: '/projects/dashboard-stats',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getStorageConfig: {
            path: '/projects/storage-config',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        updateStorageConfig: {
            path: '/projects/storage-config',
            method: 'PUT',
            baseUrl: NODEJS_BASE_URL,
        },

        // ============================================
        // ASSET ENDPOINTS
        // ============================================
        uploadAsset: {
            path: '/assets/upload',
            method: 'POST',
            baseUrl: NODEJS_BASE_URL,
        },
        listAssets: {
            path: '/assets',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getAsset: {
            path: '/assets/{id}',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        getAssetSignedUrl: {
            path: '/assets/{id}/signed-url',
            method: 'GET',
            baseUrl: NODEJS_BASE_URL,
        },
        deleteAsset: {
            path: '/assets/{id}',
            method: 'DELETE',
            baseUrl: NODEJS_BASE_URL,
        },
    },
};

export const getImageUrl = (filename: string): string => {
    if (!filename) return '';

    // Handle JSON array strings like '["filename.png"]'
    let processedFilename = filename;
    try {
        if (typeof filename === 'string' && (filename.startsWith('[') || filename.startsWith('{'))) {
            const parsed = JSON.parse(filename);
            if (Array.isArray(parsed) && parsed.length > 0) {
                processedFilename = parsed[0];
            } else if (typeof parsed === 'string') {
                processedFilename = parsed;
            }
        }
    } catch {
        // Not a JSON string, use original
    }

    if (processedFilename.startsWith('data:') || processedFilename.startsWith('blob:') || processedFilename.startsWith('http://') || processedFilename.startsWith('https://')) {
        return processedFilename;
    }

    return getApiUrl('getImage', { filename: processedFilename });
};

export const getApiUrl = (endpoint: string, pathParams: Record<string, string> = {}): string => {
    const endpointConfig = API_CONFIG.endpoints[endpoint];

    if (!endpointConfig) {
        throw new Error(`Endpoint ${endpoint} not found in API configuration`);
    }

    const baseUrl = API_CONFIG.endpoints[endpoint].baseUrl;

    // Replace path parameters in the URL
    let path = endpointConfig.path;
    Object.keys(pathParams).forEach(key => {
        path = path.replace(`{${key}}`, pathParams[key]);
    });

    const fullUrl = `${baseUrl}${path}`;

    return fullUrl;
};

export const getApiUrlWithParams = (endpoint: string, pathParams: Record<string, string> = {}, queryParams: Record<string, string> = {}): ApiConfigResult => {
    const endpointConfig = API_CONFIG.endpoints[endpoint];

    if (!endpointConfig) {
        throw new Error(`Endpoint ${endpoint} not found in API configuration`);
    }

    const baseUrl = API_CONFIG.endpoints[endpoint].baseUrl;

    // Replace path parameters in the URL
    let path = endpointConfig.path;
    Object.keys(pathParams).forEach(key => {
        path = path.replace(`{${key}}`, pathParams[key]);
    });

    const fullUrl = `${baseUrl}${path}`;

    const url = new URL(fullUrl);
    Object.keys(queryParams).forEach(key => {
        url.searchParams.append(key, queryParams[key]);
    });

    return {
        url: url.toString(),
        method: endpointConfig.method,
        baseUrl: baseUrl
    };
};

export const getApiConfig = (endpoint: string, pathParams: Record<string, string> = {}): ApiConfigResult => {
    const endpointConfig = API_CONFIG.endpoints[endpoint];

    if (!endpointConfig) {
        throw new Error(`Endpoint ${endpoint} not found in API configuration`);
    }

    const baseUrl = API_CONFIG.endpoints[endpoint].baseUrl;

    // Replace path parameters in the URL
    let path = endpointConfig.path;
    Object.keys(pathParams).forEach(key => {
        path = path.replace(`{${key}}`, pathParams[key]);
    });

    const fullUrl = `${baseUrl}${path}`;

    return {
        url: fullUrl,
        method: endpointConfig.method,
        baseUrl: baseUrl
    };
};

