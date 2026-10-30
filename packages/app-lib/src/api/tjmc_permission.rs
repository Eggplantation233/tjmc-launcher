use crate::state::{Credentials, State};
use crate::tjmc;

/// Reads the active society account's administrator level from the skin site.
///
/// The permission is deliberately not cached or accepted from the frontend:
/// skin site entries can change while the launcher is open, and the backend
/// uses the same live value to authorize local modpack imports.
pub async fn current_tjmc_permission() -> crate::Result<Option<i32>> {
    let state = State::get().await?;
    let Some(credentials) = Credentials::get_active(&state.pool).await? else {
        return Ok(None);
    };

    let is_tjmc_account = credentials
        .yggdrasil
        .as_ref()
        .is_some_and(|account| tjmc::is_yggdrasil_api_root(&account.api_root));
    if !credentials.is_yggdrasil() || !is_tjmc_account {
        return Ok(None);
    }

    crate::state::fetch_tjmc_permission(&credentials.access_token).await
}

pub fn is_tjmc_admin_permission(permission: i32) -> bool {
    matches!(permission, 1 | 2)
}

#[cfg(test)]
mod tests {
    use super::is_tjmc_admin_permission;

    #[test]
    fn only_admin_and_super_admin_are_allowed() {
        assert!(!is_tjmc_admin_permission(-1));
        assert!(!is_tjmc_admin_permission(0));
        assert!(is_tjmc_admin_permission(1));
        assert!(is_tjmc_admin_permission(2));
        assert!(!is_tjmc_admin_permission(3));
    }
}
