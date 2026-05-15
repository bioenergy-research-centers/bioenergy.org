const { validateDatafeedJson } = require("../services/validateService");

exports.validateUploadedFeed = async (req, res) => {
  try {
    if (!req.body || (typeof req.body !== "object")) {
      return res.status(400).json({
        error: "Request body must be valid JSON"
      });
    }

    const forceSchemaVersion =
      req.query.schema_version ||
      req.body.schema_version ||
      null;

    const { report } = validateDatafeedJson(req.body, {
      feedName: "uploaded feed",
      feedSource: "api",
      forceSchemaVersion
    });

    return res.status(200).json(report);
  } catch (err) {
    if (
      err.code === "INVALID_FEED_SHAPE" ||
      err.code === "UNSUPPORTED_SCHEMA_VERSION" ||
      err.code === "SCHEMA_LOAD_ERROR" ||
      err.code === "SCHEMA_COMPILE_ERROR"
    ) {
      return res.status(400).json({
        error: err.message,
        code: err.code || "VALIDATION_ERROR"
      });
    }

    console.error(err);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
};
