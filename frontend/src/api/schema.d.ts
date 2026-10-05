export interface paths {
  '/api/health': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['health_api_health_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/auth/register': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['register_api_auth_register_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/auth/login': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['login_api_auth_login_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/auth/logout': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['logout_api_auth_logout_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/auth/me': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['me_api_auth_me_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch: operations['update_profile_api_auth_me_patch']
    trace?: never
  }
  '/api/products': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['products_api_products_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/quotes': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['quote_api_quotes_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/manager/products': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['create_product_api_manager_products_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/orders': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['list_orders_api_orders_get']
    put?: never
    post: operations['create_order_api_orders_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/manager/orders': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['manager_orders_api_manager_orders_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/orders/{order_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['get_order_api_orders__order_id__get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/orders/{order_id}/comments': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['add_comment_api_orders__order_id__comments_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/orders/{order_id}/status': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch: operations['change_status_api_orders__order_id__status_patch']
    trace?: never
  }
  '/api/orders/{order_id}/artwork': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['replace_artwork_api_orders__order_id__artwork_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/files': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['upload_api_files_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/files/{file_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['download_api_files__file_id__get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
}
export type webhooks = Record<string, never>
export interface components {
  schemas: {
    ArtworkOut: {
      id: string
      name: string
      size: number
      created_at: string
    }
    CatalogOption: {
      value: string
      label: string
      hint: string
      multiplier: number
      finish?: ('smooth' | 'matte' | 'textured') | null
    }
    CatalogOptions: {
      format: components['schemas']['CatalogOption'][]
      paper: components['schemas']['CatalogOption'][]
      printing: components['schemas']['CatalogOption'][]
      quantities: number[]
    }
    CommentCreate: {
      body: string
    }
    CommentOut: {
      id: string
      author_name: string
      body: string
      created_at: string
    }
    Credentials: {
      email: string
      password: string
    }
    EventOut: {
      id: string
      status: 'new' | 'review' | 'revision' | 'printing' | 'ready' | 'completed' | 'cancelled'
      reason: string
      created_at: string
    }
    HTTPValidationError: {
      detail?: components['schemas']['ValidationError'][]
    }
    OrderCreate: {
      format: string
      paper: string
      printing: string
      quantity: number
      product_slug: string
      artwork_id: string
      contact_name: string
      contact_phone: string
      note: string
    }
    OrderOut: {
      id: string
      product_slug: string
      product_title: string
      specification: components['schemas']['PrintSettings']
      price: number
      status: 'new' | 'review' | 'revision' | 'printing' | 'ready' | 'completed' | 'cancelled'
      contact_name: string
      created_at: string
      contact_phone: string
      note: string
      files: components['schemas']['ArtworkOut'][]
      comments: components['schemas']['CommentOut'][]
      history: components['schemas']['EventOut'][]
      readonly allowed_statuses: (
        | 'new'
        | 'review'
        | 'revision'
        | 'printing'
        | 'ready'
        | 'completed'
        | 'cancelled'
      )[]
    }
    OrderSummary: {
      id: string
      product_slug: string
      product_title: string
      specification: components['schemas']['PrintSettings']
      price: number
      status: 'new' | 'review' | 'revision' | 'printing' | 'ready' | 'completed' | 'cancelled'
      contact_name: string
      created_at: string
    }
    PrintSettings: {
      format: string
      paper: string
      printing: string
      quantity: number
    }
    ProductCreate: {
      slug: string
      title: string
      description: string
      base_price: number
      options: components['schemas']['CatalogOptions']
    }
    ProductOption: {
      value: string
      label: string
      hint: string
      multiplier: number
      finish?: ('smooth' | 'matte' | 'textured') | null
    }
    ProductOptions: {
      format: components['schemas']['ProductOption'][]
      paper: components['schemas']['ProductOption'][]
      printing: components['schemas']['ProductOption'][]
      quantities: number[]
    }
    ProductOut: {
      slug: string
      title: string
      description: string
      base_price: number
      options: components['schemas']['ProductOptions']
    }
    ProfileUpdate: {
      name: string
      phone: string
    }
    QuoteOut: {
      price: number
      unit_price: number
      production_days: number
    }
    Registration: {
      email: string
      password: string
      name: string
    }
    Specification: {
      format: string
      paper: string
      printing: string
      quantity: number
      product_slug: string
    }
    StatusUpdate: {
      status: 'new' | 'review' | 'revision' | 'printing' | 'ready' | 'completed' | 'cancelled'
      reason: string
    }
    UserOut: {
      id: string
      name: string
      email: string
      phone: string
      role: 'client' | 'manager'
    }
    ValidationError: {
      loc: (string | number)[]
      msg: string
      type: string
      input?: unknown
      ctx?: Record<string, never>
    }
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}
export type $defs = Record<string, never>
export interface operations {
  health_api_health_get: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': unknown
        }
      }
    }
  }
  register_api_auth_register_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['Registration']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['UserOut']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  login_api_auth_login_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['Credentials']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['UserOut']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  logout_api_auth_logout_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: {
        tirazh_session?: string | null
      }
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  me_api_auth_me_get: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: {
        tirazh_session?: string | null
      }
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['UserOut']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  update_profile_api_auth_me_patch: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: {
        tirazh_session?: string | null
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['ProfileUpdate']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['UserOut']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  products_api_products_get: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['ProductOut'][]
        }
      }
    }
  }
  quote_api_quotes_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['Specification']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['QuoteOut']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  create_product_api_manager_products_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: {
        tirazh_session?: string | null
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['ProductCreate']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['ProductOut']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  list_orders_api_orders_get: {
    parameters: {
      query?: {
        offset?: number
        limit?: number
      }
      header?: never
      path?: never
      cookie?: {
        tirazh_session?: string | null
      }
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['OrderSummary'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  create_order_api_orders_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: {
        tirazh_session?: string | null
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['OrderCreate']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['OrderOut']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  manager_orders_api_manager_orders_get: {
    parameters: {
      query?: {
        status?: string | null
        search?: string
        offset?: number
        limit?: number
      }
      header?: never
      path?: never
      cookie?: {
        tirazh_session?: string | null
      }
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['OrderSummary'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  get_order_api_orders__order_id__get: {
    parameters: {
      query?: never
      header?: never
      path: {
        order_id: string
      }
      cookie?: {
        tirazh_session?: string | null
      }
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['OrderOut']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  add_comment_api_orders__order_id__comments_post: {
    parameters: {
      query?: never
      header?: never
      path: {
        order_id: string
      }
      cookie?: {
        tirazh_session?: string | null
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['CommentCreate']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['CommentOut']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  change_status_api_orders__order_id__status_patch: {
    parameters: {
      query?: never
      header?: never
      path: {
        order_id: string
      }
      cookie?: {
        tirazh_session?: string | null
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['StatusUpdate']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['OrderOut']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  replace_artwork_api_orders__order_id__artwork_post: {
    parameters: {
      query: {
        artwork_id: string
      }
      header?: never
      path: {
        order_id: string
      }
      cookie?: {
        tirazh_session?: string | null
      }
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['OrderOut']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  upload_api_files_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: {
        tirazh_session?: string | null
      }
    }
    requestBody?: never
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['ArtworkOut']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  download_api_files__file_id__get: {
    parameters: {
      query?: never
      header?: never
      path: {
        file_id: string
      }
      cookie?: {
        tirazh_session?: string | null
      }
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': unknown
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
}
