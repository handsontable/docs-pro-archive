docs
====

API Documentation for Handsontable

To build the documentation:
* Install the npm dependencies by typing:
```sh
npm install
```
* Install the Bower dependencies by typing:
```sh
bower install
```
* Create a `.env.json` file in the main directory, and fill it with your Github and Gitlab token data as follows:
```json
{
  "GITLAB_TOKEN": "[insert your gitlab token here]",
  "GITHUB_TOKEN": "[insert your gihub token here]"
}
```
* Run the `grunt` command.
* If you encounter the
`Warning: ENOENT: no such file or directory, open 'generated/scripts/doc-versions.js' Use --force to continue.`
problem, create a `generated/scripts` directory structure, by typing:
```sh
mkdir generated
cd generated
mkdir scripts
```

After the initial documentation setup, you can use the
```sh
grunt build
```
command, to build the documentation without cloning the Handsontable repos.
