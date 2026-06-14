import threading

from app.services.conformer import generate_conformer
from app.services.execution import CalculationBusyError, ConformerExecutor


def test_executor_rejects_work_above_concurrency_limit() -> None:
    started = threading.Event()
    release = threading.Event()

    def blocked_conformer(**kwargs: object):
        started.set()
        release.wait(timeout=2)
        return generate_conformer(**kwargs)

    executor = ConformerExecutor(
        blocked_conformer,
        max_concurrency=1,
        timeout_seconds=1,
    )
    result: list[object] = []

    thread = threading.Thread(
        target=lambda: result.append(executor.run(smiles="CCO", molfile=None, seed=1))
    )
    thread.start()
    assert started.wait(timeout=1)

    try:
        executor.run(smiles="CCO", molfile=None, seed=2)
    except CalculationBusyError:
        pass
    else:
        raise AssertionError("Expected the executor to reject work above its concurrency limit")
    finally:
        release.set()
        thread.join(timeout=2)
        executor.shutdown()

    assert result
