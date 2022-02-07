const core = require("@actions/core");

try {
  const branchName = core.getInput("branch-name");
  const event = JSON.parse(core.getInput("event"));
  const steps = JSON.parse(core.getInput("steps"));
  console.log("steps:", steps);

  // Quote literals will break things.
  event.commits.forEach((commit) => {
    // console.log("commit:", commit);
    sanitize(commit);
  });

  function sanitize(obj) {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] == "string") {
        obj[key] = obj[key].replace(/"|'/g, "");
      } else {
        sanitize(obj[key]);
      }
      return;
    });
  }
  const lastCommit = event.commits[event.commits.length - 1];

  // [...new Set] removes duplicate names
  const commitAuthors = [
    ...new Set(event.commits.map((x) => x.committer.name)),
  ];
  // console.log('commitAuthors:', commitAuthors);
  const fileChangeCount = JSON.parse(steps.files.outputs.all).length;

  const chatMsg = `'{
    "cards": [
      {
        "header": {
          "title": "Commit on ${branchName}",
          "subtitle": "Pushed by ${event.pusher.name}",
          "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Git_icon.svg/1024px-Git_icon.svg.png",
          "imageStyle": "IMAGE"
        },
        "sections": [
          {
            "widgets": [
              {
                "textParagraph": {
                  "text": "Includes:\n<b>${event.commits.length} commit${
    event.commits.length === 1 ? "" : "s"
  }</b> by ${commitAuthors.join(", ")}\n<b>${fileChangeCount} file${
    fileChangeCount === 1 ? "" : "s"
  }</b> changed",
                }
              },
              {
                "buttons":[
                  {
                    "textButton": {
                      "text": "View diff on GitHub",
                      "onClick": {
                        "openLink": {
                          "url": "${event.compare}"
                        }
                      }
                    }
                  }
                ]
              },
              {
                "textParagraph": {
                  "text": "<b>Most Recent Commit:</b>",
                }
              },
              {
                "keyValue": {
                "topLabel": "Msg",
                "content": "${lastCommit.message}",
                "contentMultiline": "true",
                }
              },
              {
                "keyValue": {
                "topLabel": "Timestamp",
                "content": "${new Date(lastCommit.timestamp).toLocaleString(
                  "en-US",
                  {timeZone: 'America/Los_Angeles', dateStyle: 'short', timeStyle: 'short'}
                )}",
                "contentMultiline": "true",
                }
              },
              {
                "keyValue": {
                "topLabel": "Author",
                "content": "${lastCommit.committer.name}",
                "contentMultiline": "true",
                }
              },
              {
                "keyValue": {
                "topLabel": "Hash",
                "content": "${lastCommit.id}",
                "contentMultiline": "true",
                }
              },
              {
                "buttons":[
                  {
                    "textButton": {
                      "text": "View commit on GitHub",
                      "onClick": {
                        "openLink": {
                          "url": "${lastCommit.url}"
                        }
                      }
                    }
                  }
                ]
              }
            ],
          },
        ]
      },
    ]
  }'`;

  core.setOutput("chat-msg", chatMsg);

} catch (error) {
  core.setFailed(error.message);
}
