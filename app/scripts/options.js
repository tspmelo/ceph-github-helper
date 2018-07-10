import * as $ from 'jquery';
let reviewers = '';
browser.storage.local.get('cgh-reviewers').then((item) => {
  let reviewers = item['cgh-reviewers'] || '';
  $('#cgh-reviewers').val(reviewers);
});

$('#cgh-save').click(() => {
  reviewers = $('#cgh-reviewers').val();
  let hasError = false;

  if (reviewers.length !== 0) {
    reviewers.split('\n').forEach((line, index) => {
      var found = line.match(/(\w*?) (.*?) <(.*?)>/);

      if (!found) {
        alert('Wrong format: line ' + index);
        hasError = true;
        return;
      }
    });
  }

  if (hasError) {
    return;
  }

  browser.storage.local.set({
    'cgh-reviewers': reviewers
  });
});
