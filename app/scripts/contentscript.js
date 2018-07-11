import * as $ from 'jquery';

let githubmap = {};

browser.runtime.onMessage.addListener(() => {
  appendHtml();
});

function appendHtml() {
  if ($('#cgh').length == 0) {
    $('#partial-pull-merging').append(
      '<div class="timeline-comment-wrapper js-comment-container" id="cgh"> \
      <div class="avatar-parent-child timeline-comment-avatar"> \
        <img class="avatar rounded-1" \
            height="44" \
            width="44" \
            src="https://avatars2.githubusercontent.com/u/1015767?s=200&v=5"> \
      </div> \
      <div class="js-minimizable-comment-group" \
          id="issuecomment-403383392"> \
        <div class="unminimized-comment editable-comment comment previewable-edit js-comment js-task-list-container timeline-comment reorderable-task-lists "> \
          <div class="timeline-comment-header clearfix"> \
            <h3 class="timeline-comment-header-text f5 text-normal"> \
              <strong class="css-truncate">Ceph Github Helper</strong> \
            </h3> \
          </div> \
          <div class="edit-comment-hide"> \
            <task-lists sortable=""> \
              <table class="d-block"> \
                <tbody class="d-block"> \
                  <tr class="d-block"> \
                    <td class="d-block comment-body markdown-body js-comment-body"> \
                    <button class="btn btn-sm" id="cgh-reviewed"> \
                    Reviewed-by \
                  </button> \
                  <button class="btn btn-sm" id="cgh-retest"> \
                    Retest \
                  </button> \
                    </td> \
                  </tr> \
                </tbody> \
              </table> \
            </task-lists> \
          </div> \
        </div> \
      </div> \
      </div>'
    );

    $('#cgh-reviewed').click(insertReviewedBy);

    $('#cgh-retest').click(insertRetest);
  }
}

function insertRetest() {
  $('#new_comment_field').val('jenkins retest this please');
}

async function insertReviewedBy() {
  await getGithubmap();
  let message = $('#merge_message_field').val();
  let participantsText = prepareParticipants();
  $('#merge_message_field').val(message + '\n' + participantsText);
}

function getGithubmap() {
  return new Promise((resolve) => {
    function reqListener() {
      browser.storage.local.get('cgh-reviewers').then((item) => {
        let reviewers = item['cgh-reviewers'] || '';
        prepareGithubmap(this.responseText + '\n' + reviewers);
        resolve('resolved');
      });
    }

    var oReq = new XMLHttpRequest();
    oReq.addEventListener('load', reqListener);
    oReq.open('GET', 'https://raw.githubusercontent.com/ceph/ceph/master/.githubmap');
    oReq.send();
  });
}

function prepareGithubmap(lines) {
  lines
    .split('\n')
    .filter((line) => line.indexOf('#') == -1 && line.length > 0)
    .forEach((line) => {
      var found = line.match(/(\w*?) (.*?) <(.*?)>/);

      githubmap[found[1]] = {
        user: found[1],
        name: found[2],
        email: found[3]
      };
    });
}

function prepareParticipants() {
  // Get author
  const author = $('.head-ref span.user').text();

  // Get participants
  let participantsText = '';
  $('.participation img').each((index, element) => {
    const participant = $(element)
      .attr('alt')
      .replace('@', '');
    if (participant != author) {
      let user = githubmap[participant];
      if (user) {
        participantsText += `\nReviewed-by: ${user.name} <${user.email}>`;
      } else {
        participantsText += `\nReviewed-by: ${participant} <NOT@FOUND>`;
      }
    }
  });

  return participantsText;
}
