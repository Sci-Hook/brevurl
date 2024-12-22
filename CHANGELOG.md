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

## [Unreleased]

### Added
- Login and sign-up pages have been created.
- Login register buttons and the username and menu that will appear in case of login have been added to the index.html file.
- Footer added to index.html file.
- Created web_config.json file where Firebase web api information is kept.
- Added three cookies, email username and role, to hold session information.

### Changed
- Notification toast moved up 60px to avoid conflict with footer.
- Added a system to setup.py that checks if the web_config.json file is empty.
- Added a route to pull web_config.json file in server py

## [Unreleased]

### Added
- Email verification system added.
- Created a toast with an option to resend the email in case the email is not verified.

### Changed
- Login is now automatic after account creation.
- Login and register pages' titles renamed as Login/Register | Brevurl

## [Unreleased]

### Added
- Password reset screen added.
- Firebase now also saves the username if logged in when a link is shortened. If not logged in, it is recorded as “Anonymous User”.


## [Unreleased]

### Added
- The template of the "Account" page where the account settings will be found with the links created by the user has been created.

### Changed
- The design of the text boxes on the home page has been harmonized with other pages.

## [Unreleased]

### Added
- My Links page has been created.

## [Unreleased]

### Added
- "Account Settings" page created.
- Password reset feature added.

## [Unreleased]

### Added
- "Admin Panel" page created.
- Added the ability to manage URLs for admins.
- Added the ability to manage users for admins.


## [Unreleased]

### Added

- In the setup file, the user is asked for the site name and this name is integrated into the site.
- Added options to allow only admins or logged in users to shorten urls.

## [Unreleased]

### Added

- Added URL short name banned list.

## [Unreleased]

### Added

- The site was made mobile compatible(after a painful process).