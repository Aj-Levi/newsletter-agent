from app.agent.state import NewsletterState

def build_html(state: NewsletterState) -> str:
    topic = state["topic"]
    subject_line = state["subject_line"]
    top_stories = state["top_stories"]
    deep_dive = state["deep_dive"]
    worth_watching = state["worth_watching"]
    closing_line = state["closing_line"]

    # Build top stories HTML
    stories_html = ""
    for story in top_stories:
        stories_html += f"""
        <tr>
          <td style="padding: 0 0 20px 0;">
            <a href="{story.get('url', '#')}" style="color: #6366f1; font-size: 16px; font-weight: 600; text-decoration: none; display: block; margin-bottom: 6px;">{story.get('title', '')}</a>
            <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">{story.get('summary', '')}</p>
          </td>
        </tr>"""

    # Build worth watching HTML
    watching_html = ""
    for item in worth_watching:
        watching_html += f"""
        <tr>
          <td style="padding: 0 0 16px 0; border-left: 3px solid #6366f1; padding-left: 14px;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #111827; font-size: 14px;">{item.get('title', '')}</p>
            <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.5;">{item.get('summary', '')}</p>
          </td>
        </tr>"""

    # Deep dive paragraphs
    deep_dive_content = deep_dive.get("content", "")
    deep_dive_title = deep_dive.get("title", "Deep Dive")
    deep_dive_paragraphs = "".join(
        f'<p style="margin: 0 0 14px 0; color: #374151; font-size: 14px; line-height: 1.8;">{p.strip()}</p>'
        for p in deep_dive_content.split("\n\n")
        if p.strip()
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{subject_line}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

  <!-- View in browser -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 10px;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          Having trouble viewing this? <a href="{{VIEW_IN_BROWSER_LINK}}" style="color: #6366f1;">View in browser</a>
        </p>
      </td>
    </tr>
  </table>

  <!-- Main container -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px 12px 0 0; padding: 32px 32px 28px 32px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #c7d2fe; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">{topic} Newsletter</p>
              <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: 700; line-height: 1.3;">{subject_line}</h1>
            </td>
          </tr>

          <!-- Top Stories -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px 32px 24px 32px;">
              <h2 style="margin: 0 0 20px 0; font-size: 13px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1.5px;">🔥 Top Stories</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                {stories_html}
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="background-color: #ffffff; padding: 0 32px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;" />
            </td>
          </tr>

          <!-- Deep Dive -->
          <tr>
            <td style="background-color: #ffffff; padding: 28px 32px;">
              <h2 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1.5px;">🔬 Deep Dive</h2>
              <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #111827; font-weight: 700;">{deep_dive_title}</h3>
              {deep_dive_paragraphs}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="background-color: #ffffff; padding: 0 32px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;" />
            </td>
          </tr>

          <!-- Worth Watching -->
          <tr>
            <td style="background-color: #ffffff; padding: 28px 32px 32px 32px;">
              <h2 style="margin: 0 0 20px 0; font-size: 13px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1.5px;">👀 Worth Watching</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                {watching_html}
              </table>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="background-color: #fafafa; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151; font-style: italic;">"{closing_line}"</p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                You're receiving this because you subscribed to {topic} updates.<br/>
                <a href="{{UNSUBSCRIBE_LINK}}" style="color: #6366f1;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>"""


async def formatter_node(state: NewsletterState) -> dict:
    html = build_html(state)
    return {"html_content": html}