import * as $ from 'jquery/dist/jquery.slim.js';

let githubmap = {};

fetch(chrome.extension.getURL('/pages/content.html'))
  .then((response) => response.text())
  .then((data) => {
    document.body.innerHTML += data;

    addImageSrc('cgh-main-icon', '/images/ceph-40.png');
    addImageSrc('cgh-jenkins-icon', '/images/jenkins-40.png');

    $('.cgh-scroll-up').click(scrollTop);
    $('.cgh-jenkins-cmds .SelectMenu-item').click(insertJenkinsCmd);
    $('.cgh-add-reviewers').click(insertReviewedBy);
    $('.cgh-scroll-down').click(scrollBottom);
    $('.cgh-main-button').click(toggleVisibility);
  })
  .catch((err) => {
    // handle error
  });

function toggleVisibility() {
  $('.ceph-github-helper ul').toggle();
}

function scrollBottom() {
  $('body > div.footer')[0].scrollIntoView();
}

function scrollTop() {
  $('body > div > header')[0].scrollIntoView();
}

function addImageSrc(selector, image) {
  const element = document.getElementById(selector);
  const iconUrl = chrome.extension.getURL(image);
  element.src = iconUrl;
}

function insertJenkinsCmd() {
  scrollBottom();

  const cmd = $(this)
    .text()
    .trim();

  $('#new_comment_field').val(cmd);
  $('#partial-new-comment-form-actions [type="submit"].btn-primary').attr(
    'disabled',
    false
  );
}

async function insertReviewedBy() {
  $('.discussion-timeline-actions')[0].scrollIntoView();

  await getGithubmap();
  let message = $('#merge_message_field').val();
  let participantsText = prepareParticipants();
  $('#merge_message_field').val(message + '\n' + participantsText);
}

function getGithubmap() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ contentScriptQuery: 'githubmap' }, (map) => {
      browser.storage.local.get('cgh-reviewers').then((item) => {
        let reviewers = item['cgh-reviewers'] || '';
        prepareGithubmap(map + '\n' + reviewers);
        resolve('resolved');
      });
    });
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
  let author = $('.gh-header-meta .author').text();

  // Get participants
  let participantsText = '';

  $.map($('.participation img'), (element) => {
    return $(element)
      .attr('alt')
      .replace('@', '');
  })
    .sort()
    .forEach((participant) => {
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
