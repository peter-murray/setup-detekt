# setup-detekt

This is a GitHub Action that will resolve and install a specific version of detekt on to a GitHub Actions Runner if
not already present in the tool cache.

It will provide an output of the path to the tool, as well as optionally add it to the PATH for you.

The action supports and is tested on Windows, Ubuntu and MacOS.

## Implementation

This action utilizes the GitHub Actions tool cache functionality so that when downloading version of detekt from https://github.com/detekt/detekt
they are cached for re-use to prevent unnecessary downloading if already retrieved in another job.

The Action will process the releases from the https://github.com/detekt/detekt repository, showing only versions that provide 
the `detekt` file asset in the releases.


## Change in command line v0.17+

Since version 0.17 and greater the release bundles for detekt were changed to move to a CLI provided zip file instead of a completely self-contained binary.

When using versions `0.17+` of detekt, this action will download and wire the CLI bundle in to the PATH via the GitHub Actions tool-cache and as such the
executable that you need to call is `detekt-cli` and not `detekt` as is was in previous versions.


## Parameters

* `detekt_version`: The version of detekt to download, defaults to `1.15.0`, will be changed match the the latest version in the future
* `add_to_path`: A boolean flag indicating whether or not to add detekt to the PATH, defaults to `true`


## Outputs

* `detekt`: The path to the detekt executable that was resolved, downloaded and installed into the tool cache


## Examples

Setup detekt version `1.18` and then invoke it.

```yml
name: Install detekt

on:
  workflow_dispatch:

jobs:
  detekt:
    runs-on: ubuntu-latest

    steps:
      - name: Setup detekt
        uses: peter-murray/setup-detekt@v1
        with:
          detekt_version: 1.18

      - name: Run detekt
        run: detekt-cli --version
```

Setup detekt version `1.18` but not put it on the PATH, and then invoke it.

```yml
name: Install detekt

on:
  workflow_dispatch:

jobs:
  detekt:
    runs-on: ubuntu-latest

    steps:
      - name: Setup detekt
        uses: peter-murray/setup-detekt@v1
        with:
          detekt_version: 1.18
          add_to_path: false

      - name: Run detekt
        run: ${{ steps.setup_detekt.outputs.detekt }}/detekt-cli --version
```

Note, on Windows runners you would need to use `detekt-cli.bat` instead of `detekt-cli` above.


Setup detekt version `1.15`, not installing it on the PATH and then invoking it via reference (this is an executable release version)

```yml
name: Install detekt

on:
  workflow_dispatch:

jobs:
  detekt:
    runs-on: ubuntu-latest

    steps:
      - name: Setup detekt
        id: setup_detekt
        uses: peter-murray/setup-detekt@v1
        with:
          detekt_version: v0.15
          add_to_path: false

      - name: Run detekt
        run: ${{ steps.setup_detekt.outputs.detekt }} --version
```
