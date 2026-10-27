//! One-time copy of an existing launcher installation into TJMC's data
//! directory.
//!
//! TJMC uses the independent identifier `club.tjmc.launcher`. On first start it
//! prefers data from the SITMC build (`club.sitmc.launcher`) and falls back to
//! upstream Axolotl (`red.ghs.axolotl`) when no SITMC data exists. Migration is
//! deliberately a copy: the source launcher and its data remain untouched so
//! SITMC and TJMC can be installed side by side.

use std::fs;
use std::path::{Path, PathBuf};

/// Data directories checked in priority order.
const SOURCE_IDENTIFIERS: &[&str] =
    &["club.sitmc.launcher", "red.ghs.axolotl"];

/// Identifier this launcher uses now.
const CURRENT_IDENTIFIER: &str = "club.tjmc.launcher";

/// Marker written after a complete copy, so an already initialized TJMC
/// directory does not attempt migration again on every start.
const MIGRATION_MARKER: &str = ".legacy-migration-complete";

/// Whether an older installation has data that has not yet been copied.
pub fn migration_pending() -> bool {
    if crate::portable::is_portable_mode() {
        return false;
    }

    let Some(data_root) = dirs::data_dir() else {
        return false;
    };
    let current_dir = data_root.join(CURRENT_IDENTIFIER);
    if current_dir.join(MIGRATION_MARKER).is_file()
        || current_has_data(&current_dir)
    {
        return false;
    }

    first_source_dir(&data_root).is_some()
}

/// Copies the preferred legacy data directory into TJMC's directory.
///
/// Runs before the state database is opened. Existing TJMC files are never
/// overwritten, and source files are never moved or removed. A partial failed
/// copy leaves both directories intact; the next launch retries because the
/// completion marker is only written after success.
pub fn migrate() -> Result<(), String> {
    if crate::portable::is_portable_mode() {
        return Ok(());
    }

    let Some(data_root) = dirs::data_dir() else {
        return Ok(());
    };
    let current_dir = data_root.join(CURRENT_IDENTIFIER);
    if current_dir.join(MIGRATION_MARKER).is_file()
        || current_has_data(&current_dir)
    {
        return Ok(());
    }

    let Some(source_dir) = first_source_dir(&data_root) else {
        return Ok(());
    };

    match copy_missing_directory(&source_dir, &current_dir) {
        Ok(()) => {
            complete(&current_dir, &source_dir);
            eprintln!(
                "Copied launcher data from {} to {}; the source was left in place",
                source_dir.display(),
                current_dir.display()
            );
            Ok(())
        }
        Err(error) => {
            eprintln!(
                "Could not copy launcher data from {} to {}: {error}. Both launchers and their data were left in place.",
                source_dir.display(),
                current_dir.display()
            );
            Err(format!(
                "旧版启动器数据未能复制（{error}）。请关闭旧版启动器后重试；TJMC 和旧版的数据均未删除。"
            ))
        }
    }
}

fn first_source_dir(data_root: &Path) -> Option<PathBuf> {
    SOURCE_IDENTIFIERS
        .iter()
        .map(|identifier| data_root.join(identifier))
        .find(|path| path.is_dir())
}

/// A database in any supported update channel means TJMC already owns data.
fn current_has_data(current_dir: &Path) -> bool {
    ["app.db", "release/app.db", "beta/app.db"]
        .iter()
        .any(|relative| current_dir.join(relative).is_file())
}

fn complete(current_dir: &Path, source_dir: &Path) {
    let marker = format!(
        "copied from {}\n",
        source_dir.file_name().unwrap_or_default().to_string_lossy()
    );
    if let Err(error) =
        fs::write(current_dir.join(MIGRATION_MARKER), marker.as_bytes())
    {
        eprintln!("Could not record the completed migration: {error}");
    }
}

/// Copies missing entries recursively without overwriting TJMC data.
fn copy_missing_directory(
    source: &Path,
    target: &Path,
) -> std::io::Result<()> {
    fs::create_dir_all(target)?;

    for entry in fs::read_dir(source)? {
        let entry = entry?;
        let from = entry.path();
        let to = target.join(entry.file_name());

        if to.exists() {
            if entry.file_type()?.is_dir() && to.is_dir() {
                copy_missing_directory(&from, &to)?;
            } else {
                eprintln!(
                    "Keeping {} (already exists in the TJMC directory)",
                    to.display()
                );
            }
            continue;
        }

        if entry.file_type()?.is_dir() {
            copy_missing_directory(&from, &to)?;
        } else {
            fs::copy(&from, &to)?;
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn copies_without_overwriting_or_removing_the_source() {
        let root = temp_root("copy");
        let source = root.join("old");
        let target = root.join("new");
        fs::create_dir_all(source.join("instances")).unwrap();
        fs::create_dir_all(target.join("logs")).unwrap();
        fs::write(source.join("app.db"), b"legacy").unwrap();
        fs::write(source.join("instances").join("instance.json"), b"legacy")
            .unwrap();
        fs::write(target.join("app.db"), b"current").unwrap();

        copy_missing_directory(&source, &target).unwrap();

        assert_eq!(fs::read(target.join("app.db")).unwrap(), b"current");
        assert_eq!(
            fs::read(target.join("instances").join("instance.json")).unwrap(),
            b"legacy"
        );
        assert_eq!(fs::read(source.join("app.db")).unwrap(), b"legacy");
        assert!(source.is_dir(), "the source directory must be preserved");

        fs::remove_dir_all(&root).ok();
    }

    #[test]
    fn prefers_sitmc_data_over_upstream_axolotl_data() {
        let root = temp_root("priority");
        fs::create_dir_all(root.join("club.sitmc.launcher")).unwrap();
        fs::create_dir_all(root.join("red.ghs.axolotl")).unwrap();

        assert_eq!(
            first_source_dir(&root),
            Some(root.join("club.sitmc.launcher"))
        );

        fs::remove_dir_all(&root).ok();
    }

    fn temp_root(label: &str) -> PathBuf {
        let unique = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("tjmc-migrate-{label}-{unique}"))
    }
}
