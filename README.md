# FTPSYNC Releases

Official public distribution repository for FTPSYNC desktop and Docker/NAS releases.

**[Download FTPSYNC](https://ftpsync.io/download)** · **[Docker / NAS downloads and setup](https://ftpsync.io/docker)**

This repository contains installers, packaged applications, release notes and signed update metadata. Application source code is maintained separately in a private repository and is not distributed here.

## Current downloads

<!-- FTPSYNC-DOWNLOADS:START -->
| Edition | Current version | Published | Download |
| --- | --- | --- | --- |
| Windows Stable | 0.22.2 | 28 November 2026 | [Windows installer](https://github.com/contemptx/ftpsync-releases/releases/download/v0.22.2/FTPSYNC-0.22.2-windows-x86_64-Setup.exe) · [Release notes](https://github.com/contemptx/ftpsync-releases/releases/tag/v0.22.2) |
| Windows Preview / beta | 0.22.0-rc.60 | 28 November 2026 | [Windows installer](https://github.com/contemptx/ftpsync-releases/releases/download/v0.22.0-rc.60/FTPSYNC-0.22.0-rc.60-windows-x86_64-Setup.exe) · [Release notes](https://github.com/contemptx/ftpsync-releases/releases/tag/v0.22.0-rc.60) |
| Docker / NAS Preview | 0.22.0-rc.60 | 28 November 2026 | [amd64 bundle](https://github.com/contemptx/ftpsync-releases/releases/download/nas-v0.22.0-rc.60/FTPSYNC-NAS-0.22.0-rc.60-amd64.zip) · [arm64 bundle](https://github.com/contemptx/ftpsync-releases/releases/download/nas-v0.22.0-rc.60/FTPSYNC-NAS-0.22.0-rc.60-arm64.zip) · [Setup instructions](https://ftpsync.io/docker) |

### Latest five Windows releases

| Version | Channel | Published |
| --- | --- | --- |
| [0.22.0-rc.60](https://github.com/contemptx/ftpsync-releases/releases/tag/v0.22.0-rc.60) | Preview / beta | 28 November 2026 |
| [0.22.0-rc.58](https://github.com/contemptx/ftpsync-releases/releases/tag/v0.22.0-rc.58) | Preview / beta | 28 November 2026 |
| [0.22.2](https://github.com/contemptx/ftpsync-releases/releases/tag/v0.22.2) | Stable | 28 November 2026 |
| [0.22.1](https://github.com/contemptx/ftpsync-releases/releases/tag/v0.22.1) | Stable | 28 November 2026 |
| [0.22.0-rc.57](https://github.com/contemptx/ftpsync-releases/releases/tag/v0.22.0-rc.57) | Preview / beta | 28 November 2026 |

[Full release archive](https://github.com/contemptx/ftpsync-releases/releases)
<!-- FTPSYNC-DOWNLOADS:END -->

For a new Windows installation, download the file ending in `-Setup.exe` from the release page. If FTPSYNC is already installed, open **Settings → Software updates** to check your channel.

The current Windows releases include fixes for a licence activation check that could get stuck, add a redacted report for support, and keep saved account access connected until sign-out or revocation. Persistent FTP account connections are supported in both current Windows channels, without hourly credential renewal.

Docker/NAS is a separate Preview release for Linux amd64 and arm64. Download the bundle for your architecture and follow the [Docker setup instructions](https://ftpsync.io/docker); container updates are separate from Windows software updates.

## Updates

FTPSYNC uses signed update metadata. Stable and Preview are separate update channels; publishing a Preview does not move Stable users onto that version. Automatic installation remains disabled.

Windows application and Setup binaries currently show **Unknown Publisher** because they are not Windows code-signed. This is separate from the signed update metadata.

The download tables are maintained from published release assets. Only the latest five Windows releases are listed here; the full archive, signed update feeds and existing download links remain available.

## Website

Visit [ftpsync.io](https://ftpsync.io) for product information and [pricing](https://ftpsync.io/pricing) for software licences. Content access tokens and build purchases are separate from software licences.
