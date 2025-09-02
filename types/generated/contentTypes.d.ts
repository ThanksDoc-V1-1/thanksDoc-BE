import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiAdminAdmin extends Struct.CollectionTypeSchema {
  collectionName: 'admins';
  info: {
    description: 'Admin users for the system';
    displayName: 'Admin';
    pluralName: 'admins';
    singularName: 'admin';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    firstName: Schema.Attribute.String;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    lastName: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::admin.admin'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    password: Schema.Attribute.Password &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    passwordResetExpires: Schema.Attribute.DateTime & Schema.Attribute.Private;
    passwordResetToken: Schema.Attribute.String & Schema.Attribute.Private;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.String & Schema.Attribute.DefaultTo<'admin'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiBusinessComplianceDocumentTypeBusinessComplianceDocumentType
  extends Struct.CollectionTypeSchema {
  collectionName: 'business_compliance_document_types';
  info: {
    description: 'Configurable document types for business compliance requirements';
    displayName: 'Business Compliance Document Type';
    pluralName: 'business-compliance-document-types';
    singularName: 'business-compliance-document-type';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    acceptedFormats: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'.pdf,.jpg,.jpeg,.png'>;
    allowedFileTypes: Schema.Attribute.JSON &
      Schema.Attribute.DefaultTo<['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']>;
    autoExpiry: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    category: Schema.Attribute.Enumeration<
      [
        'registration',
        'insurance',
        'financial',
        'compliance',
        'operational',
        'legal',
        'other',
      ]
    > &
      Schema.Attribute.DefaultTo<'other'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    displayOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    examples: Schema.Attribute.Text;
    expiryWarningDays: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 365;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<30>;
    helpText: Schema.Attribute.Text;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    key: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::business-compliance-document-type.business-compliance-document-type'
    > &
      Schema.Attribute.Private;
    maxFileSize: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 52428800;
          min: 1024;
        },
        number
      > &
      Schema.Attribute.DefaultTo<10485760>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    required: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    validityYears: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 10;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
  };
}

export interface ApiBusinessComplianceDocumentBusinessComplianceDocument
  extends Struct.CollectionTypeSchema {
  collectionName: 'business_compliance_documents';
  info: {
    description: 'Compliance documents for business verification';
    displayName: 'Business Compliance Document';
    pluralName: 'business-compliance-documents';
    singularName: 'business-compliance-document';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    autoExpiry: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    business: Schema.Attribute.Relation<'manyToOne', 'api::business.business'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    daysUntilExpiry: Schema.Attribute.Integer;
    documentType: Schema.Attribute.String & Schema.Attribute.Required;
    expiryDate: Schema.Attribute.Date;
    expiryStatus: Schema.Attribute.Enumeration<
      ['valid', 'expiring', 'expired']
    > &
      Schema.Attribute.DefaultTo<'valid'>;
    fileName: Schema.Attribute.String & Schema.Attribute.Required;
    fileSize: Schema.Attribute.Integer;
    fileUrl: Schema.Attribute.String & Schema.Attribute.Required;
    issueDate: Schema.Attribute.Date;
    lastModified: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::business-compliance-document.business-compliance-document'
    > &
      Schema.Attribute.Private;
    mimeType: Schema.Attribute.String;
    notes: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    rejectionReason: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    uploadedAt: Schema.Attribute.DateTime &
      Schema.Attribute.DefaultTo<'2023-01-01T00:00:00.000Z'>;
    verificationStatus: Schema.Attribute.Enumeration<
      ['pending', 'verified', 'rejected']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    verifiedAt: Schema.Attribute.DateTime;
    verifiedBy: Schema.Attribute.String;
  };
}

export interface ApiBusinessTypeBusinessType
  extends Struct.CollectionTypeSchema {
  collectionName: 'business_types';
  info: {
    description: 'Available business types for registration';
    displayName: 'Business Type';
    pluralName: 'business-types';
    singularName: 'business-type';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 500;
      }>;
    displayOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::business-type.business-type'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    value: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
  };
}

export interface ApiBusinessBusiness extends Struct.CollectionTypeSchema {
  collectionName: 'businesses';
  info: {
    description: 'Business profiles for ThanksDoc platform';
    displayName: 'Business';
    pluralName: 'businesses';
    singularName: 'business';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    address: Schema.Attribute.Text;
    businessLicense: Schema.Attribute.String;
    businessName: Schema.Attribute.String & Schema.Attribute.Required;
    businessType: Schema.Attribute.String & Schema.Attribute.Required;
    city: Schema.Attribute.String;
    complianceDocuments: Schema.Attribute.Relation<
      'oneToMany',
      'api::business-compliance-document.business-compliance-document'
    >;
    contactPersonName: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    emailVerificationExpires: Schema.Attribute.DateTime &
      Schema.Attribute.Private;
    emailVerificationToken: Schema.Attribute.String & Schema.Attribute.Private;
    emergencyContact: Schema.Attribute.String;
    isEmailVerified: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    isVerified: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    latitude: Schema.Attribute.Decimal;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::business.business'
    > &
      Schema.Attribute.Private;
    longitude: Schema.Attribute.Decimal;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    operatingHours: Schema.Attribute.JSON;
    password: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    passwordResetExpires: Schema.Attribute.DateTime & Schema.Attribute.Private;
    passwordResetToken: Schema.Attribute.String & Schema.Attribute.Private;
    paymentMethods: Schema.Attribute.JSON;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    state: Schema.Attribute.String;
    stripeCustomerId: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    verificationStatusReason: Schema.Attribute.Text;
    verificationStatusUpdatedAt: Schema.Attribute.DateTime;
    zipCode: Schema.Attribute.String;
  };
}

export interface ApiComplianceDocumentTypeComplianceDocumentType
  extends Struct.CollectionTypeSchema {
  collectionName: 'compliance_document_types';
  info: {
    description: 'Configurable document types for doctor compliance requirements';
    displayName: 'Compliance Document Type';
    pluralName: 'compliance-document-types';
    singularName: 'compliance-document-type';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    allowedFileTypes: Schema.Attribute.JSON &
      Schema.Attribute.DefaultTo<['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']>;
    autoExpiry: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    displayOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    expiryWarningDays: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 365;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<30>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    key: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::compliance-document-type.compliance-document-type'
    > &
      Schema.Attribute.Private;
    maxFileSize: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 52428800;
          min: 1024;
        },
        number
      > &
      Schema.Attribute.DefaultTo<10485760>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    required: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    validationRules: Schema.Attribute.JSON;
    validityYears: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 10;
          min: 1;
        },
        number
      >;
  };
}

export interface ApiComplianceDocumentComplianceDocument
  extends Struct.CollectionTypeSchema {
  collectionName: 'compliance_documents';
  info: {
    description: 'Doctor compliance documents with AWS S3 storage';
    displayName: 'Compliance Document';
    pluralName: 'compliance-documents';
    singularName: 'compliance-document';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    autoExpiry: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    doctor: Schema.Attribute.Relation<'manyToOne', 'api::doctor.doctor'>;
    documentName: Schema.Attribute.String & Schema.Attribute.Required;
    documentType: Schema.Attribute.String & Schema.Attribute.Required;
    expiryDate: Schema.Attribute.Date;
    fileName: Schema.Attribute.String & Schema.Attribute.Required;
    fileSize: Schema.Attribute.Integer & Schema.Attribute.Required;
    fileType: Schema.Attribute.String & Schema.Attribute.Required;
    isRequired: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    issueDate: Schema.Attribute.Date;
    lastModified: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::compliance-document.compliance-document'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    originalFileName: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    s3Bucket: Schema.Attribute.String & Schema.Attribute.Required;
    s3Key: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    s3Url: Schema.Attribute.String & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<
      ['uploaded', 'missing', 'expiring', 'expired']
    > &
      Schema.Attribute.DefaultTo<'uploaded'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    uploadedAt: Schema.Attribute.DateTime &
      Schema.Attribute.DefaultTo<'CURRENT_TIMESTAMP'>;
    validityYears: Schema.Attribute.Integer;
    verificationStatus: Schema.Attribute.Enumeration<
      ['pending', 'verified', 'rejected']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    verifiedAt: Schema.Attribute.DateTime;
    verifiedBy: Schema.Attribute.String;
  };
}

export interface ApiDoctorPaymentDoctorPayment
  extends Struct.CollectionTypeSchema {
  collectionName: 'doctor_payments';
  info: {
    description: 'Track doctor payment records';
    displayName: 'Doctor Payment';
    pluralName: 'doctor-payments';
    singularName: 'doctor-payment';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    amount: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    doctor: Schema.Attribute.Relation<'manyToOne', 'api::doctor.doctor'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::doctor-payment.doctor-payment'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    paymentDate: Schema.Attribute.DateTime & Schema.Attribute.Required;
    paymentMethod: Schema.Attribute.Enumeration<
      ['bank_transfer', 'paypal', 'stripe', 'cash']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'bank_transfer'>;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<['pending', 'completed', 'failed']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'completed'>;
    transactionId: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiDoctorDoctor extends Struct.CollectionTypeSchema {
  collectionName: 'doctors';
  info: {
    description: 'Doctor profiles for ThanksDoc platform';
    displayName: 'Doctor';
    pluralName: 'doctors';
    singularName: 'doctor';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    address: Schema.Attribute.Text & Schema.Attribute.Required;
    bio: Schema.Attribute.Text;
    certifications: Schema.Attribute.JSON;
    city: Schema.Attribute.String & Schema.Attribute.Required;
    complianceDocuments: Schema.Attribute.Relation<
      'oneToMany',
      'api::compliance-document.compliance-document'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    emailVerificationExpires: Schema.Attribute.DateTime &
      Schema.Attribute.Private;
    emailVerificationToken: Schema.Attribute.String & Schema.Attribute.Private;
    emergencyContact: Schema.Attribute.String;
    firstName: Schema.Attribute.String & Schema.Attribute.Required;
    hourlyRate: Schema.Attribute.Decimal;
    isAvailable: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    isEmailVerified: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    isVerified: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    languages: Schema.Attribute.JSON;
    lastName: Schema.Attribute.String & Schema.Attribute.Required;
    latitude: Schema.Attribute.Decimal;
    licenseNumber: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::doctor.doctor'
    > &
      Schema.Attribute.Private;
    longitude: Schema.Attribute.Decimal;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    password: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    passwordResetExpires: Schema.Attribute.DateTime & Schema.Attribute.Private;
    passwordResetToken: Schema.Attribute.String & Schema.Attribute.Private;
    phone: Schema.Attribute.String & Schema.Attribute.Required;
    professionalReferences: Schema.Attribute.Relation<
      'oneToMany',
      'api::professional-reference.professional-reference'
    >;
    profilePicture: Schema.Attribute.Media<'images'>;
    publishedAt: Schema.Attribute.DateTime;
    referenceSubmissions: Schema.Attribute.Relation<
      'oneToMany',
      'api::professional-reference-submission.professional-reference-submission'
    >;
    serviceRadius: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<12>;
    services: Schema.Attribute.Relation<'manyToMany', 'api::service.service'>;
    specialization: Schema.Attribute.String;
    state: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    verificationStatusReason: Schema.Attribute.Text;
    verificationStatusUpdatedAt: Schema.Attribute.DateTime;
    yearsOfExperience: Schema.Attribute.Integer;
    zipCode: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ApiProfessionalReferenceSubmissionProfessionalReferenceSubmission
  extends Struct.CollectionTypeSchema {
  collectionName: 'professional_reference_submissions';
  info: {
    description: 'Professional reference submissions for doctors from their references';
    displayName: 'Professional Reference Submission';
    pluralName: 'professional-reference-submissions';
    singularName: 'professional-reference-submission';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    clinicalDecisionMaking: Schema.Attribute.Enumeration<
      [
        'Poor',
        'Less than satisfactory',
        'Satisfactory',
        'Good',
        'Very good',
        'N/A',
      ]
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    clinicalKnowledge: Schema.Attribute.Enumeration<
      [
        'Poor',
        'Less than satisfactory',
        'Satisfactory',
        'Good',
        'Very good',
        'N/A',
      ]
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    clinicianEmail: Schema.Attribute.Email;
    clinicianName: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    clinicianPosition: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    commitmentToCare: Schema.Attribute.Enumeration<
      [
        'Poor',
        'Less than satisfactory',
        'Satisfactory',
        'Good',
        'Very good',
        'N/A',
      ]
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    communicationWithPatients: Schema.Attribute.Enumeration<
      [
        'Poor',
        'Less than satisfactory',
        'Satisfactory',
        'Good',
        'Very good',
        'N/A',
      ]
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    diagnosis: Schema.Attribute.Enumeration<
      [
        'Poor',
        'Less than satisfactory',
        'Satisfactory',
        'Good',
        'Very good',
        'N/A',
      ]
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    doctor: Schema.Attribute.Relation<'manyToOne', 'api::doctor.doctor'>;
    effectiveTimeManagement: Schema.Attribute.Enumeration<
      [
        'Poor',
        'Less than satisfactory',
        'Satisfactory',
        'Good',
        'Very good',
        'N/A',
      ]
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    emailSentAt: Schema.Attribute.DateTime;
    fitToPractice: Schema.Attribute.Enumeration<['Yes', 'No']>;
    honestAndTrustworthy: Schema.Attribute.Enumeration<
      ['Strongly disagree', 'Disagree', 'Agree', 'Strongly agree', 'N/A']
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    isEmailSent: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isSubmitted: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    keepingKnowledgeUpToDate: Schema.Attribute.Enumeration<
      [
        'Poor',
        'Less than satisfactory',
        'Satisfactory',
        'Good',
        'Very good',
        'N/A',
      ]
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    lastWorkedWith: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::professional-reference-submission.professional-reference-submission'
    > &
      Schema.Attribute.Private;
    medicalRecordKeeping: Schema.Attribute.Enumeration<
      [
        'Poor',
        'Less than satisfactory',
        'Satisfactory',
        'Good',
        'Very good',
        'N/A',
      ]
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    performanceNotImpaired: Schema.Attribute.Enumeration<
      ['Strongly disagree', 'Disagree', 'Agree', 'Strongly agree', 'N/A']
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    prescribing: Schema.Attribute.Enumeration<
      [
        'Poor',
        'Less than satisfactory',
        'Satisfactory',
        'Good',
        'Very good',
        'N/A',
      ]
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    professionalReference: Schema.Attribute.Relation<
      'manyToOne',
      'api::professional-reference.professional-reference'
    >;
    publishedAt: Schema.Attribute.DateTime;
    recognisingLimitations: Schema.Attribute.Enumeration<
      [
        'Poor',
        'Less than satisfactory',
        'Satisfactory',
        'Good',
        'Very good',
        'N/A',
      ]
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    refereeEmail: Schema.Attribute.Email;
    refereeName: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    refereePosition: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    refereeWorkPlace: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 300;
      }>;
    referenceToken: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    respectsPatientConfidentiality: Schema.Attribute.Enumeration<
      ['Strongly disagree', 'Disagree', 'Agree', 'Strongly agree', 'N/A']
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    reviewingPerformance: Schema.Attribute.Enumeration<
      [
        'Poor',
        'Less than satisfactory',
        'Satisfactory',
        'Good',
        'Very good',
        'N/A',
      ]
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    submittedAt: Schema.Attribute.DateTime;
    supervisingColleagues: Schema.Attribute.Enumeration<
      [
        'Poor',
        'Less than satisfactory',
        'Satisfactory',
        'Good',
        'Very good',
        'N/A',
      ]
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    teachingStudents: Schema.Attribute.Enumeration<
      [
        'Poor',
        'Less than satisfactory',
        'Satisfactory',
        'Good',
        'Very good',
        'N/A',
      ]
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    treatment: Schema.Attribute.Enumeration<
      [
        'Poor',
        'Less than satisfactory',
        'Satisfactory',
        'Good',
        'Very good',
        'N/A',
      ]
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workDuration: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    workingEffectivelyWithColleagues: Schema.Attribute.Enumeration<
      [
        'Poor',
        'Less than satisfactory',
        'Satisfactory',
        'Good',
        'Very good',
        'N/A',
      ]
    > &
      Schema.Attribute.DefaultTo<'N/A'>;
  };
}

export interface ApiProfessionalReferenceProfessionalReference
  extends Struct.CollectionTypeSchema {
  collectionName: 'professional_references';
  info: {
    description: 'Professional references for doctors';
    displayName: 'Professional Reference';
    pluralName: 'professional-references';
    singularName: 'professional-reference';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    doctor: Schema.Attribute.Relation<'manyToOne', 'api::doctor.doctor'>;
    documentType: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'professional-references'>;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    firstName: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    lastName: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::professional-reference.professional-reference'
    > &
      Schema.Attribute.Private;
    organisation: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
        minLength: 1;
      }>;
    position: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
        minLength: 1;
      }>;
    publishedAt: Schema.Attribute.DateTime;
    submissions: Schema.Attribute.Relation<
      'oneToMany',
      'api::professional-reference-submission.professional-reference-submission'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiServiceRequestServiceRequest
  extends Struct.CollectionTypeSchema {
  collectionName: 'service_requests';
  info: {
    description: 'Service requests from businesses to doctors';
    displayName: 'Service Request';
    pluralName: 'service-requests';
    singularName: 'service-request';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    acceptedAt: Schema.Attribute.DateTime;
    business: Schema.Attribute.Relation<'manyToOne', 'api::business.business'> &
      Schema.Attribute.Required;
    businessLatitude: Schema.Attribute.Decimal;
    businessLongitude: Schema.Attribute.Decimal;
    cancelReason: Schema.Attribute.Text;
    chargeId: Schema.Attribute.String;
    completedAt: Schema.Attribute.DateTime;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'GBP'>;
    declinedByDoctors: Schema.Attribute.Relation<
      'manyToMany',
      'api::doctor.doctor'
    >;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    distanceFilter: Schema.Attribute.Integer;
    doctor: Schema.Attribute.Relation<'manyToOne', 'api::doctor.doctor'>;
    doctorPaidAt: Schema.Attribute.DateTime;
    doctorSelectionType: Schema.Attribute.Enumeration<
      ['any', 'previous', 'specific']
    > &
      Schema.Attribute.DefaultTo<'any'>;
    estimatedDuration: Schema.Attribute.Integer;
    feedback: Schema.Attribute.Text;
    isBroadcasted: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    isPaid: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isPatientRequest: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::service-request.service-request'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    originalRequestId: Schema.Attribute.Integer & Schema.Attribute.Private;
    paidAt: Schema.Attribute.DateTime;
    patientEmail: Schema.Attribute.String;
    patientFirstName: Schema.Attribute.String;
    patientLastName: Schema.Attribute.String;
    patientPhone: Schema.Attribute.String;
    paymentDetails: Schema.Attribute.Text;
    paymentIntentId: Schema.Attribute.String;
    paymentMethod: Schema.Attribute.String;
    paymentStatus: Schema.Attribute.Enumeration<
      ['pending', 'paid', 'failed', 'refunded', 'doctor_paid']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    preferredDoctorId: Schema.Attribute.Integer;
    publishedAt: Schema.Attribute.DateTime;
    rating: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 5;
          min: 1;
        },
        number
      >;
    rejectedAt: Schema.Attribute.DateTime;
    rejectedBy: Schema.Attribute.Relation<'manyToOne', 'api::doctor.doctor'>;
    rejectionReason: Schema.Attribute.Text;
    requestedAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    requestedServiceDateTime: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    service: Schema.Attribute.Relation<'manyToOne', 'api::service.service'>;
    serviceType: Schema.Attribute.String & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<
      [
        'pending',
        'accepted',
        'rejected',
        'in_progress',
        'completed',
        'cancelled',
      ]
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    totalAmount: Schema.Attribute.Decimal;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    urgencyLevel: Schema.Attribute.Enumeration<
      ['low', 'medium', 'high', 'emergency']
    > &
      Schema.Attribute.Required;
    videoCallEndedAt: Schema.Attribute.DateTime;
    videoCallStartedAt: Schema.Attribute.DateTime;
    wherebyMeetingId: Schema.Attribute.String;
    wherebyRoomUrl: Schema.Attribute.String;
  };
}

export interface ApiServiceService extends Struct.CollectionTypeSchema {
  collectionName: 'services';
  info: {
    description: 'Medical services that doctors can offer';
    displayName: 'Service';
    pluralName: 'services';
    singularName: 'service';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    category: Schema.Attribute.Enumeration<['in-person', 'online', 'nhs']> &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    displayOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    doctors: Schema.Attribute.Relation<'manyToMany', 'api::doctor.doctor'>;
    duration: Schema.Attribute.Integer & Schema.Attribute.Required;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::service.service'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    price: Schema.Attribute.Decimal & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSystemSettingSystemSetting
  extends Struct.CollectionTypeSchema {
  collectionName: 'system_settings';
  info: {
    description: 'System-wide configuration settings';
    displayName: 'System Setting';
    pluralName: 'system-settings';
    singularName: 'system-setting';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    category: Schema.Attribute.String & Schema.Attribute.DefaultTo<'general'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dataType: Schema.Attribute.Enumeration<
      ['string', 'number', 'boolean', 'json']
    > &
      Schema.Attribute.DefaultTo<'string'>;
    description: Schema.Attribute.Text;
    isPublic: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    key: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::system-setting.system-setting'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    value: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface ApiWhatsappWhatsapp extends Struct.CollectionTypeSchema {
  collectionName: 'whatsapps';
  info: {
    description: 'WhatsApp message logs and webhook data';
    displayName: 'WhatsApp';
    pluralName: 'whatsapps';
    singularName: 'whatsapp';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    content: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::whatsapp.whatsapp'
    > &
      Schema.Attribute.Private;
    messageId: Schema.Attribute.String & Schema.Attribute.Unique;
    messageType: Schema.Attribute.Enumeration<['text', 'template', 'webhook']> &
      Schema.Attribute.DefaultTo<'text'>;
    phoneNumber: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['sent', 'delivered', 'read', 'failed']
    > &
      Schema.Attribute.DefaultTo<'sent'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    webhookData: Schema.Attribute.JSON;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.String;
    caption: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.String;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.String & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::admin.admin': ApiAdminAdmin;
      'api::business-compliance-document-type.business-compliance-document-type': ApiBusinessComplianceDocumentTypeBusinessComplianceDocumentType;
      'api::business-compliance-document.business-compliance-document': ApiBusinessComplianceDocumentBusinessComplianceDocument;
      'api::business-type.business-type': ApiBusinessTypeBusinessType;
      'api::business.business': ApiBusinessBusiness;
      'api::compliance-document-type.compliance-document-type': ApiComplianceDocumentTypeComplianceDocumentType;
      'api::compliance-document.compliance-document': ApiComplianceDocumentComplianceDocument;
      'api::doctor-payment.doctor-payment': ApiDoctorPaymentDoctorPayment;
      'api::doctor.doctor': ApiDoctorDoctor;
      'api::professional-reference-submission.professional-reference-submission': ApiProfessionalReferenceSubmissionProfessionalReferenceSubmission;
      'api::professional-reference.professional-reference': ApiProfessionalReferenceProfessionalReference;
      'api::service-request.service-request': ApiServiceRequestServiceRequest;
      'api::service.service': ApiServiceService;
      'api::system-setting.system-setting': ApiSystemSettingSystemSetting;
      'api::whatsapp.whatsapp': ApiWhatsappWhatsapp;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
