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


## Parameters

* `detekt_version`: The version of detekt to download, defaults to `0.15.0`, will be changed match the the latest version in the future
* `add_to_path`: A boolean flag indicating whether or not to add detekt to the PATH, defaults to `true`


## Outputs

* `detekt`: The path to the detekt executable that was resolved, downloaded and installed into the tool cache


## Examples

Setup detekt version `1.15.0` and then invoke it.

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
          detekt_version: 1.15.0

      - name: Run detekt
        run: detekt --version
```

Setup detekt version `1.13.0`, not installing it on the PATH and then invoking it via reference

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
          detekt_version: v0.13.0
          add_to_path: false

      - name: Run detekt
        run: ${{ steps.setup_detekt.outputs.detekt }} --version
```
