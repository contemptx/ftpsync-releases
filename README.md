# FTPSYNC Releases

Official public distribution repository for FTPSYNC desktop releases.

This repository contains installers, packaged applications, release notes and signed update metadata. Application source code is maintained separately in a private repository and is not distributed here.

## Windows downloads

| Channel | Current Windows release | Download |
| --- | --- | --- |
| Stable | 0.22.2 (28 November 2026) | [Latest Stable release](https://github.com/contemptx/ftpsync-releases/releases/latest) |
| Preview / beta | 0.22.0-rc.58 (28 November 2026) | [RC58 Preview release](https://github.com/contemptx/ftpsync-releases/releases/tag/v0.22.0-rc.58) |

For a new installation, download the file ending in `-Setup.exe` from the release page. If FTPSYNC is already installed, open **Settings → Software updates** to check your channel.

Both releases fix a licence activation check that could get stuck, add a redacted report for support, and keep saved account access connected until sign-out or revocation. Persistent FTP account connections are supported in both current releases, without hourly credential renewal. [All releases](https://github.com/contemptx/ftpsync-releases/releases)

## Updates

FTPSYNC uses signed update metadata. Stable and Preview are separate update channels; publishing a Preview does not move Stable users onto that version. Automatic installation remains disabled.

Windows application and Setup binaries currently show **Unknown Publisher** because they are not Windows code-signed. This is separate from the signed update metadata.

## Website

Visit [ftpsync.io](https://ftpsync.io) for product information and [pricing](https://ftpsync.io/pricing) for software licences. Content access tokens and build purchases are separate from software licences.
