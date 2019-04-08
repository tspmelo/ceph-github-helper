import * as $ from 'jquery';

let githubmap = {};

browser.runtime.onMessage.addListener(() => {
  appendHtml();
});

const jenkins_commands = {
  'ceph dashboard tests': 'jenkins test dashboard',
  'Docs: build check': 'jenkins test docs',
  'Signed-off-by': '',
  'Unmodified Submodules': '',
  'make check': 'jenkins test make check',
  'make check (arm64)': 'jenkins test make check arm64'
};

function appendHtml() {
  if ($('#cgh').length == 0) {
    $('.merge-status-item.d-flex.flex-items-baseline').each(function(i) {
      const merge_status = $(this)
        .find('.text-emphasized')
        .text()
        .trim();

      if (!!jenkins_commands[merge_status]) {
        $(this).append(
          '<div class="d-flex col-1 ml-2"> \
            <button class="btn btn-sm status-actions cgh-btn" title="Retest"> \
              <svg class="octicon octicon-sync" viewBox="0 0 12 16" version="1.1" width="16" height="16"> \
                <path fill-rule="evenodd" d="M10.24 7.4a4.15 4.15 0 0 1-1.2 3.6 4.346 4.346 0 0 1-5.41.54L4.8 10.4.5 9.8l.6 4.2 1.31-1.26c2.36 1.74 5.7 1.57 7.84-.54a5.876 5.876 0 0 0 1.74-4.46l-1.75-.34zM2.96 5a4.346 4.346 0 0 1 5.41-.54L7.2 5.6l4.3.6-.6-4.2-1.31 1.26c-2.36-1.74-5.7-1.57-7.85.54C.5 5.03-.06 6.65.01 8.26l1.75.35A4.17 4.17 0 0 1 2.96 5z"></path> \
              </svg> \
            </button> \
          </div>'
        );
      }

      $(this)
        .find('button.cgh-btn')
        .click(function() {
          $('#new_comment_field').val(jenkins_commands[merge_status]);
        });
    });

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
