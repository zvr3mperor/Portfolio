# Self-writing portfolio

Open `index.html` to preview the site. It uses plain HTML, CSS, and JavaScript, and all artwork is bundled.

## Publish to GitHub Pages

1. Extract the ZIP.
2. Copy its contents into the root of your GitHub repository, including the `.nojekyll` file if your file browser shows it.
3. In **Settings → Pages**, choose **Deploy from a branch**, then **main** and **/(root)**. Select **Save**.

## Customize

Edit your intro, bio, and GitHub username in `index.html`. The included projects and artwork are samples.

To add a project, copy any complete `<article>` inside the Work section. Give each block a unique `id` and replace the title, description, image path, and alternative text. Use an image in `assets/` and update its width and height attributes to its actual dimensions. Text inside a `data-type` span is typed automatically.

```html
<article class="project frame-wire" id="my-project" style="--project-ink:#d7b7ff">
  <figure class="project-image">
    <img src="./assets/my-image.webp" width="960" height="600" alt="Describe the image">
  </figure>
  <div class="project-copy">
    <p class="project-kind">TOOLS · JAVASCRIPT</p>
    <h3><span data-type>My project</span></h3>
    <p class="description"><span data-type>What I made and why.</span></p>
  </div>
</article>
```

| Frame class | Appearance |
| --- | --- |
| `frame-none` | No border |
| `frame-round` | Rounded corners |
| `frame-square` | Square corners |
| `frame-wire` | Dark red wireframe |

Set `--project-ink` on a block to change its title and description color. Change `--ink` at the top of `style.css` for the default text color and `--red` for the accent.

## Playback

Auto-scroll starts after a short delay. Scroll up to pause the build and scroll down to resume it. Previously revealed content stays in place, and refreshes in the same tab preserve the build stage. The toolbar also has playback controls. Visitors who prefer reduced motion see the completed portfolio and static terminal rain.
