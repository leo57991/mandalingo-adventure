extends Node2D

enum UiState { EXPLORING, DIALOGUE, CHARACTER }

@onready var player: MandalingoPlayer = $World/Objects/Player
@onready var dialogue_panel: PanelContainer = $UI/DialoguePanel
@onready var dialogue_text: RichTextLabel = $UI/DialoguePanel/Margin/DialogueText
@onready var character_panel: PanelContainer = $UI/CharacterPanel
@onready var notebook_text: RichTextLabel = $UI/CharacterPanel/Margin/VBox/Tabs/Notebook/NotebookText
@onready var guess_input: LineEdit = $UI/CharacterPanel/Margin/VBox/Tabs/Notebook/GuessRow/GuessInput
@onready var save_guess_button: Button = $UI/CharacterPanel/Margin/VBox/Tabs/Notebook/GuessRow/SaveGuess
@onready var character_button: Button = $UI/CharacterButton
@onready var hint: Label = $UI/Hint

var notebook: Dictionary = {}
var last_word := ""
var ui_state := UiState.EXPLORING
var ui_state_stack: Array[int] = [UiState.EXPLORING]

func _ready() -> void:
	player.interact_requested.connect(_on_interact_requested)
	save_guess_button.pressed.connect(_save_guess)
	guess_input.text_submitted.connect(_save_guess)
	character_button.pressed.connect(_toggle_character_menu)
	_set_ui_state(UiState.EXPLORING)
	hint.text = "WASD Move　Shift Run　E Observe / Talk　I Character　Esc Close"

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		if ui_state != UiState.EXPLORING:
			_pop_ui_state()
			get_viewport().set_input_as_handled()
			return
	if event.is_action_pressed("inventory") or event.is_action_pressed("notebook"):
		_toggle_character_menu()
	if event.is_action_pressed("debug_collisions"):
		get_tree().debug_collisions_hint = not get_tree().debug_collisions_hint

func _on_interact_requested(from_position: Vector2) -> void:
	if ui_state != UiState.EXPLORING:
		return
	var nearest: MandalingoInteractable
	var nearest_distance := INF
	for candidate in get_tree().get_nodes_in_group("interactable"):
		if candidate is MandalingoInteractable and candidate.overlaps_body(player):
			var distance := from_position.distance_to(candidate.global_position)
			if distance < nearest_distance:
				nearest = candidate
				nearest_distance = distance
	if nearest == null:
		dialogue_text.text = "[center][font_size=20]There is nothing nearby to examine.[/font_size][/center]"
	else:
		_record_entry(nearest.read_entry())
	_push_ui_state(UiState.DIALOGUE)

func _record_entry(entry: Dictionary) -> void:
	var word: String = entry.word
	if not notebook.has(word):
		notebook[word] = {"count": 0, "location": "", "guess": "(no guess yet)", "contexts": {}}
	notebook[word]["count"] += 1
	notebook[word]["location"] = entry.location
	var occurrence_id: String = entry.get("occurrence_id", entry.location + ":" + word)
	notebook[word]["contexts"][occurrence_id] = {
		"location": entry.location,
		"line": entry.get("line", word),
		"context": entry.context
	}
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

func _toggle_character_menu() -> void:
	if ui_state == UiState.CHARACTER:
		_pop_ui_state()
	else:
		_push_ui_state(UiState.CHARACTER)

func _set_character_menu_open(is_open: bool) -> void:
	if is_open and ui_state != UiState.CHARACTER:
		_push_ui_state(UiState.CHARACTER)
	elif not is_open and ui_state == UiState.CHARACTER:
		_pop_ui_state()

func _set_ui_state(next_state: int) -> void:
	ui_state_stack = [next_state]
	_apply_ui_state()

func _push_ui_state(next_state: int) -> void:
	if ui_state == next_state:
		return
	ui_state_stack.push_back(next_state)
	_apply_ui_state()

func _pop_ui_state() -> void:
	if ui_state_stack.size() > 1:
		ui_state_stack.pop_back()
	_apply_ui_state()

func _apply_ui_state() -> void:
	ui_state = ui_state_stack.back()
	dialogue_panel.visible = ui_state == UiState.DIALOGUE
	character_panel.visible = ui_state == UiState.CHARACTER
	character_button.text = "CLOSE [I]" if ui_state == UiState.CHARACTER else "CHARACTER [I]"
	player.set_movement_enabled(ui_state == UiState.EXPLORING)
	if ui_state == UiState.CHARACTER:
		_refresh_notebook()
	else:
		guess_input.release_focus()

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
		var distinct_contexts: int = entry.get("contexts", {}).size()
		lines += "[font_size=48][color=#edcf8b]" + word + "[/color][/font_size]\n"
		lines += "Seen: " + str(entry["count"]) + " times　Distinct contexts: " + str(distinct_contexts) + "　Last place: " + entry["location"] + "\n"
		lines += "Your English guess: " + entry["guess"] + "\n"
		if word == "水" and distinct_contexts >= 2:
			lines += "[color=#79b9cf]Water-spell insight is beginning to form.[/color]\n"
		lines += "\n"
	notebook_text.text = lines
