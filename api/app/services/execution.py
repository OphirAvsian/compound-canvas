from collections.abc import Callable
from concurrent.futures import Future, ThreadPoolExecutor, TimeoutError
from threading import BoundedSemaphore

from .conformer import ConformerResult


class CalculationBusyError(RuntimeError):
    """Raised when all calculation slots are occupied."""


class CalculationTimeoutError(RuntimeError):
    """Raised when a calculation exceeds the public request deadline."""


CalculationFunction = Callable[..., object]
ConformerFunction = Callable[..., ConformerResult]


class CalculationExecutor:
    def __init__(
        self,
        function: CalculationFunction,
        *,
        max_concurrency: int,
        timeout_seconds: float,
        thread_name_prefix: str = "rdkit-calculation",
    ) -> None:
        self.function = function
        self.timeout_seconds = timeout_seconds
        self._slots = BoundedSemaphore(max_concurrency)
        self._executor = ThreadPoolExecutor(
            max_workers=max_concurrency,
            thread_name_prefix=thread_name_prefix,
        )
        self._shutdown = False

    @property
    def ready(self) -> bool:
        return not self._shutdown

    def run(
        self,
        **kwargs: object,
    ) -> object:
        if self._shutdown or not self._slots.acquire(blocking=False):
            raise CalculationBusyError

        future: Future[object] = self._executor.submit(
            self.function,
            **kwargs,
        )
        future.add_done_callback(lambda _: self._slots.release())

        try:
            return future.result(timeout=self.timeout_seconds)
        except TimeoutError as error:
            raise CalculationTimeoutError from error

    def shutdown(self) -> None:
        self._shutdown = True
        self._executor.shutdown(wait=False, cancel_futures=True)


class ConformerExecutor(CalculationExecutor):
    def __init__(
        self,
        function: ConformerFunction,
        *,
        max_concurrency: int,
        timeout_seconds: float,
    ) -> None:
        super().__init__(
            function,
            max_concurrency=max_concurrency,
            timeout_seconds=timeout_seconds,
            thread_name_prefix="rdkit-conformer",
        )

    def run(
        self,
        *,
        smiles: str | None,
        molfile: str | None,
        seed: int,
    ) -> ConformerResult:
        return super().run(smiles=smiles, molfile=molfile, seed=seed)  # type: ignore[return-value]
