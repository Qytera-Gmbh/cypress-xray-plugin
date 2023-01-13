# Remove existing directory to not publish outdated stuff.
npx shx rm -r dist/
# Compile Typescript code to vanilla JavaScript + type declarations.
npm run build
# Prepare package inside the build directory.
npx shx cp package.json README.md LICENSE.md dist/
# Publish from inside the build directory.
cd dist/
npm publish