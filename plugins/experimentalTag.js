
exports.defineTags = function(dictionary) {
  dictionary.defineTag('experimental', {
    mustHaveValue: false,
    isNamespace: false,

    onTagged: function(doclet, tag) {
      doclet.experimental = true;
    }
  })
};
