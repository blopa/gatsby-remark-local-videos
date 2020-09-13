const select = require('unist-util-select').selectAll;
const isRelativeUrl = require('is-relative-url');
const Promise = require('bluebird');

const allowedFiletypes = ['mp4', 'webm'];

module.exports = (
    { files, markdownNode, markdownAST, pathPrefix, getNode, reporter },
    pluginOptions
) => {
    // This will only work for markdown syntax image tags
    const markdownVideoNodes = select('image', markdownAST);

    // Takes a node and generates the needed videos and then returns
    // the needed HTML replacement for the video
    const generateVideosAndUpdateNode = async (node, resolve) => {
        // Check if this markdownNode has a File parent. This plugin
        // won't work if the video isn't hosted locally.

        const fileType = node.url.split('.').pop();
        const videoTag = `
        <video controlsList="nodownload" controls loop preload style="width: 100%" >
          <source src="${node.url}" type="video/${fileType}">
        </video>
    `;

        return `
      <div class="gatsby-remark-local-videos">${videoTag}</div>
    `;
    };

    return Promise.all(
        // Simple because there is no nesting in markdown
        markdownVideoNodes.map(
            (node) =>
                // eslint-disable-next-line no-async-promise-executor
                new Promise(async (resolve, reject) => {
                    const fileType = node.url.split('.').pop();

                    if (isRelativeUrl(node.url) && allowedFiletypes.includes(fileType)) {
                        const rawHTML = await generateVideosAndUpdateNode(node, resolve);

                        if (rawHTML) {
                            // Replace the video node with an inline HTML node.
                            // eslint-disable-next-line no-param-reassign
                            node.type = 'html';
                            // eslint-disable-next-line no-param-reassign
                            node.value = rawHTML;
                        }

                        return resolve(node);
                    }

                    // Video isn't relative so there's nothing for us to do.
                    return resolve();

                })
        )
    ).then((mdVideoNodes) => mdVideoNodes.filter((node) => !!node));
};
