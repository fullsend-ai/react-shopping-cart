const StarButton = () => (
  <div className="star-button-container">
    <p>
      <small>Leave a star on Github if this repository was useful :)</small>
    </p>
    {/* No data-show-count: rendering the count makes buttons.js call
        api.github.com, which the deployed CSP's connect-src does not allow. */}
    <a
      className="github-button"
      href="https://github.com/jeffersonRibeiro/react-shopping-cart"
      data-icon="octicon-star"
      data-size="large"
      aria-label="Star jeffersonRibeiro/react-shopping-cart on GitHub"
      tabIndex={-1}
    >
      Star
    </a>
  </div>
);

export default StarButton;
