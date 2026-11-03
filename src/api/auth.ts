export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  email_confirmed: boolean;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface MessageResponse {
  message: string;
}

export interface ApiError {
  code: string;
  detail: string;
}

/**
 * Handles API fetch responses and parses standard JSON errors.
 * @param response - Fetch API Response object.
 * @returns Parsed JSON response.
 * @throws ApiError if status is not OK.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error: ApiError = {
      code: data.code || `HTTP_${response.status}`,
      detail: typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail || "Error"),
    };
    throw error;
  }
  return data as T;
}

/**
 * Registers a new user account via API.
 * @param payload - User registration details.
 * @returns Newly registered unconfirmed user.
 */
export async function registerUser(payload: RegisterPayload): Promise<AuthUser> {
  const response = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthUser>(response);
}

/**
 * Confirms an email address with a single-use token.
 * @param token - Raw verification token string.
 * @returns Success message.
 */
export async function confirmEmail(token: string): Promise<MessageResponse> {
  const response = await fetch("/api/v1/auth/confirm-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return handleResponse<MessageResponse>(response);
}

/**
 * Authenticates user credentials and retrieves JWT token.
 * @param payload - Login credentials.
 * @returns Access token and user profile.
 */
export async function loginUser(payload: LoginPayload): Promise<AuthTokenResponse> {
  const response = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthTokenResponse>(response);
}

/**
 * Requests a password reset link to be dispatched to the given email.
 * @param email - Target email address.
 * @returns Server acknowledgment message.
 */
export async function requestPasswordReset(email: string): Promise<MessageResponse> {
  const response = await fetch("/api/v1/auth/request-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse<MessageResponse>(response);
}

/**
 * Sets a new password using a valid reset token.
 * @param payload - Reset token and new password.
 * @returns Success message.
 */
export async function resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
  const response = await fetch("/api/v1/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<MessageResponse>(response);
}

/**
 * Changes password for currently authenticated user.
 * @param payload - Current and new passwords.
 * @param token - Bearer JWT access token.
 * @returns Success message.
 */
export async function changePassword(
  payload: ChangePasswordPayload,
  token: string
): Promise<MessageResponse> {
  const response = await fetch("/api/v1/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<MessageResponse>(response);
}

/**
 * Revokes the active session token.
 * @param token - Bearer JWT access token.
 * @returns Success message.
 */
export async function logoutUser(token: string): Promise<MessageResponse> {
  const response = await fetch("/api/v1/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<MessageResponse>(response);
}

/**
 * Retrieves profile of currently authenticated user.
 * @param token - Bearer JWT access token.
 * @returns User profile.
 */
export async function getCurrentUser(token: string): Promise<AuthUser> {
  const response = await fetch("/api/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<AuthUser>(response);
}
