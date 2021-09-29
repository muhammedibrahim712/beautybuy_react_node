# BeautyBuy [![Node.js CI](https://github.com/shizunge/valuebuy-proof-of-concept/workflows/Node.js%20CI/badge.svg)](https://github.com/shizunge/valuebuy-proof-of-concept/actions)
BeautyBuy™ is an automatic purchase machine for cosmetics and skin care products that finds the best deals and enables the sale that meets the price target that customers set.

## Local Setup
Follow these instructions to setup and run this project on your local computer.

### Prerequisite
To build and run this application, you will need the following tools:
- [Node.js](https://nodejs.org/en/download/)
- [Java](https://www.oracle.com/java/technologies/javase-downloads.html) (usually pre-installed on macOS and Linux)
- [Python](https://www.python.org/downloads/) (Optional, usually pre-installed on macOS and Linux)

##### Notes for Windows
- Enable [Linux Bash Shell](https://www.laptopmag.com/articles/use-bash-shell-windows-10).
- Create the missing symbolic links to the [fonts](app/www/fonts) and [images](app/www/images) folders using the [`mklink`](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/mklink) command:
> ```
> c:\valuebuy-proof-of-concept\app>mklink /d src\images www\images
> symbolic link created for src\images <<===>> www\images
>
> c:\valuebuy-proof-of-concept\app>mklink /d src\fonts www\fonts
> symbolic link created for src\fonts <<===>> www\fonts
> ```


### Configuration
Create the `.env` file in the root directory of this project and fill in the following properties:

```
# Database configuration:
PGUSER=
PGHOST=
PGPASSWORD=
PGDATABASE=
PGPORT=

# Firebase configuration:
FIREBASE_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_APP_ID=
FIREBASE_MESSAGING_SENDER_ID=
```

#### Notes
For local development, the database configuration is optional.
All data is mocked and is located in the [mocks](bff/mocks) folder.

### Install dependencies
For the first run:

```bash
npm install
```

### Build and run development version
The following commands will create static bundle files and start the web server on [localhost:4000](http://localhost:4000):

```bash
npm run bundle
npm run dev
```

##### Notes for Windows
If the `npm run bundle` command fails for some reason, do the following:
> ```bash
> cd app/bin
> ./bundle
> ```

### Build and run production version
The following commands will create an application bundle and start the web server on [localhost:4000](http://localhost:4000):

```bash
npm run build
npm start
```

### Run unit tests
Run unit tests before each push to the repository:

```bash
npm test
```

### Enjoy your development
Feel free to add new or modify existing features.


## Heroku Setup
Follow these instructions to setup and run this project on Heroku.

### Add environment variables
<img src="tmp/heroku-config-vars.png?raw=true">

### Add build packs
<img src="tmp/heroku-buildpacks.png?raw=true">

List of required buildpacks:
- https://github.com/heroku/heroku-buildpack-jvm-common
- https://github.com/heroku/heroku-buildpack-nodejs

