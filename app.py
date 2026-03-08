from __future__ import annotations

from pathlib import Path

from flask import Flask, jsonify, render_template, request

from src.tracker import PositionTrackerService

app = Flask(__name__)
service = PositionTrackerService(storage_dir=Path("data/store"))


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/snapshots")
def snapshots():
    return jsonify(service.list_snapshots())


@app.get("/api/positions")
def positions():
    snapshot_date = request.args.get("snapshot_date", "").strip()
    if not snapshot_date:
        return jsonify({"error": "snapshot_date is required"}), 400
    share_code = request.args.get("share_code", "").strip().upper() or None
    try:
        rows = service.get_positions(snapshot_date=snapshot_date, share_code=share_code)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(rows)


@app.get("/api/movements")
def movements():
    older_date = request.args.get("older_date", "").strip()
    newer_date = request.args.get("newer_date", "").strip()
    if not older_date or not newer_date:
        return jsonify({"error": "older_date and newer_date are required"}), 400
    try:
        rows = service.compare_snapshots(older_date=older_date, newer_date=newer_date)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(rows)


@app.post("/api/import")
def import_pdf():
    body = request.get_json(silent=True) or {}
    pdf_path = Path(body.get("pdf_path", "")).expanduser()
    if not pdf_path.exists():
        return jsonify({"error": f"pdf not found: {pdf_path}"}), 400
    result = service.import_pdf(pdf_path)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
