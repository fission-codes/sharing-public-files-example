const app = document.getElementById('app');
const scenarioSpan = document.getElementById('scenario');
const signInButton = document.getElementById('signIn');
const textInput = document.getElementById('textInput');
const saveTextButtton = document.getElementById('saveText');
const publicLinkAnchor = document.getElementById('publicLink');
const currentLinkAnchor = document.getElementById('currentVersionLink');
const versions = document.getElementById('versions');

let fs;
let publicLink = null;

const fissionInit = {
  permissions: {
    app: {
      name: 'sharing-public-files',
      creator: 'bgins'
    },
    fs: {
      public: [webnative.path.directory('examples')]
    }
  }
};


webnative.initialize(fissionInit).then(async state => {
  switch (state.scenario) {
    case webnative.Scenario.AuthSucceeded:
    case webnative.Scenario.Continuation:
      scenarioSpan.textContent = 'Signed in.';
      showApp();

      fs = state.fs;

      if (await fs.exists(webnative.path.file("public", "examples", "shared.txt"))) {

        /**
         * Set the public link if it has not been set.
         */
        if (!publicLink) {
          publicLink = `https://${state.username}.files.fission.name/p/examples/shared.txt`;
          setPublicLink(publicLink);
        }

        /**
        * Set the archival link for the current version of file.
        */
        const rootCid = await fs.root.put();
        currentVersionLink = `https://ipfs.runfission.com/ipfs/${rootCid}/p/examples/shared.txt`
        setCurrentLink(currentVersionLink);

        /**
         * Traverse the file history and generate links for all older versions of the file.
         * This will not include the current version of the file.
        */
        const file = await fs.get(webnative.path.file("public", "examples", "shared.txt"));
        const history = await file.history.list();
        history.forEach(async versionMetadata => {
          const version = await file.history.back(versionMetadata.delta);
          const versionedLink = `https://ipfs.runfission.com/ipfs/${version.cid}/userland`
          prependVersion(versionedLink);
        });
      }

      saveTextButtton.addEventListener('click', async (event) => {
        event.preventDefault();
        const content = textInput.value;

        if (fs.exists(webnative.path.directory("public", "examples"))) {
          await fs.write(webnative.path.file("public", "examples", "shared.txt"), content);
          await fs.publish();

          /**
           * Set the public link if it has not been set.
           */
          if (!publicLink) {
            publicLink = `https://${state.username}.files.fission.name/p/examples/shared.txt`;
            setPublicLink(publicLink);
          }

          /**
           * Set the archival link for the current version of file.
           */
          const rootCid = await fs.root.put();
          currentVersionLink = `https://ipfs.runfission.com/ipfs/${rootCid}/p/examples/shared.txt`
          setCurrentLink(currentVersionLink);

          /**
           * Add the last version of the app to the older versions.
           */
          const file = await fs.get(webnative.path.file("public", "examples", "shared.txt"));
          const history = await file.history.list();
          if (history.length > 0) {
            const backOneVersion = await file.history.back(-1);
            const versionedLink = `https://ipfs.runfission.com/ipfs/${backOneVersion.cid}/userland`;
            prependVersion(versionedLink);
          }
        }
      });

      break;

    case webnative.Scenario.NotAuthorised:
    case webnative.Scenario.AuthCancelled:
      scenarioSpan.textContent = 'Not signed in.';
      showSignInButton();

      break;
  }

  signInButton.addEventListener('click', () => {
    webnative.redirectToLobby(state.permissions);
  });

}).catch(error => {
  switch (error) {
    case 'UNSUPPORTED_BROWSER':
      scenarioSpan.textContent = 'Unsupported browser.';
      break;

    case 'INSECURE_CONTEXT':
      scenarioSpan.textContent = 'Insecure context.';
      break;
  }
})

function setPublicLink(publicLink) {
  publicLinkAnchor.setAttribute('href', publicLink);
  publicLinkAnchor.textContent = publicLink;
}

function setCurrentLink(currentVersionLink) {
  currentLinkAnchor.setAttribute('href', currentVersionLink);
  currentLinkAnchor.textContent = currentVersionLink;
}

function prependVersion(link) {
  const a = document.createElement('a');
  a.setAttribute('href', link);
  a.textContent = link;
  a.style.display = 'block';
  a.target = '_blank';
  versions.prepend(a);
}

function showApp() {
  app.style.display = 'block';
}

function showSignInButton() {
  signInButton.style.display = 'inline-block';
}
