# Ollama 

Ollama lets you run large language models locally on your machine.

Aurora supports Ollama by default. You don't need to configure anything if you are using Ollama on `localhost:11434`. Aurora will automatically detect it.

If you face any issues with Ollama, please check the [Ollama Connection Issues](/connection-issue.md) guide.


## Multiple Ollama Instances

You can configure multiple Ollama instances by following these steps:


1. Click on the Aurora icon on the browser toolbar.

2. Click on the `Settings` icon.

3. Go to the `OpenAI Compatible API` tab.

4. Click on the `Add Provider` button.

5. Select `Ollama` from the dropdown.

6. Enter the `Ollama URL`.

7. Click on the `Save` button.

You don't need to add any models since Aurora will automatically fetch them from the Ollama instance you have configured.