# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).



## [Unreleased]

### Added
- Added a button to copy url on success toast
- Three different toasts were created: error, information and success.

### Fixed
- Fixed a redirect issue when https is not placed at the beginning of a link

### Changed
- Notification toasts moved to bottom right
- The website is now served via Flask
- brevurl_config.json file is now automatically called in server.py

### Removed
- cors.py file and src/web directory removed