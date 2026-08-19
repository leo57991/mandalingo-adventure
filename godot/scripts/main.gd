extends Node2D

const INTERACT_DISTANCE := 175.0

@onready var player: MandalingoPlayer = $World/Objects/Player
@onready var dialogue_panel: PanelContainer = $UI/DialoguePanel
@onready var dialogue_text: RichTextLabel = $UI/DialoguePanel/Margin/DialogueText
@onready var notebook_panel: PanelContainer = $UI/NotebookPanel
@onready var notebook_text: RichTextLabel = $UI/NotebookPanel/Margin/VBox/NotebookText
@onready var guess_input: LineEdit = $UI/NotebookPanel/Margin/VBox/GuessRow/GuessInput
@onready var save_guess_button: Button = $UI/NotebookPanel/Margin/VBox/GuessRow/SaveGuess
@onready var notebook_button: Button = $UI/NotebookButton
@onready var hint: Label = $UI/Hint

var notebook: Dictionary = {}
var last_word := ""

func _ready() -> void:
	player.interact_requested.connect(_on_interact_requested)
	save_guess_button.pressed.connect(_save_guess)
	guess_input.text_submitted.connect(_save_guess)
	notebook_button.pressed.connect(_toggle_notebook)
	dialogue_panel.hide()
	notebook_panel.hide()
	hint.text = "WASD Move　E Observe / Talk　N Notebook　Esc Close"

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		if dialogue_panel.visible or notebook_panel.visible:
			dialogue_panel.hide()
			notebook_panel.hide()
			notebook_button.text = "NOTEBOOK"
			get_viewport().set_input_as_handled()
		return
	if event.is_action_pressed("notebook"):
		_toggle_notebook()
	if event.is_action_pressed("debug_collisions"):
		get_tree().debug_collisions_hint = not get_tree().debug_collisions_hint

func _on_interact_requested(from_position: Vector2) -> void:
	notebook_panel.hide()
	notebook_button.text = "NOTEBOOK"
	var nearest: MandalingoInteractable
	var nearest_distance := INF
	for candidate in get_tree().get_nodes_in_group("interactable"):
		if candidate is MandalingoInteractable:
			var distance := from_position.distance_to(candidate.global_position)
			if distance < INTERACT_DISTANCE and distance < nearest_distance:
				nearest = candidate
				nearest_distance = distance
	if nearest == null:
		dialogue_text.text = "[center][font_size=20]There is nothing nearby to examine.[/font_size][/center]"
	else:
		_record_entry(nearest.read_entry())
	dialogue_panel.show()

func _record_entry(entry: Dictionary) -> void:
	var word: String = entry.word
	if not notebook.has(word):
		notebook[word] = {"count": 0, "location": "", "guess": "(no guess yet)"}
	notebook[word]["count"] += 1
	notebook[word]["location"] = entry.location
	last_word = word
	var spoken_line: String = entry.get("line", word)
	var highlighted_word := "[font_size=72][color=#edcf8b]" + word + "[/color][/font_size]"
	var styled_line := spoken_line.replace(word, highlighted_word)
	dialogue_text.text = (
		"[center][font_size=19][color=#c8d0cc]" + entry.context + "[/color][/font_size]\n"
		+ "[font_size=44][color=#aeb8b3]" + styled_line + "[/color][/font_size]\n"
		+ "[font_size=15][color=#9fb3a6]Added to notebook · encounter "
		+ str(notebook[word]["count"]) + "[/color][/font_size][/center]"
	)
	_refresh_notebook()

func _toggle_notebook() -> void:
	notebook_panel.visible = not notebook_panel.visible
	dialogue_panel.hide()
	notebook_button.text = "CLOSE NOTEBOOK" if notebook_panel.visible else "NOTEBOOK"
	_refresh_notebook()

func _save_guess(_submitted_text := "") -> void:
	var guess := guess_input.text.strip_edges()
	if last_word.is_empty() or guess.is_empty():
		return
	notebook[last_word]["guess"] = guess
	guess_input.clear()
	_refresh_notebook()

func _refresh_notebook() -> void:
	if notebook.is_empty():
		notebook_text.text = "[font_size=24]Water Foundations[/font_size]\n\nNo words recorded yet. Examine the stele or watch the gatekeeper."
		return
	var lines := "[font_size=24]Water Foundations[/font_size]\n[color=#9fb3a6]Keep your own interpretation. The notebook will simply save it for now.[/color]\n\n"
	for word in notebook:
		var entry: Dictionary = notebook[word]
		lines += "[font_size=48][color=#edcf8b]" + word + "[/color][/font_size]\n"
		lines += "Seen: " + str(entry["count"]) + " times　Last place: " + entry["location"] + "\n"
		lines += "Your English guess: " + entry["guess"] + "\n"
		if word == "水" and entry["count"] >= 2:
			lines += "[color=#79b9cf]Water-spell insight is beginning to form.[/color]\n"
		lines += "\n"
	notebook_text.text = lines
