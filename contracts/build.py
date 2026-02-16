from pathlib import Path
from algopy.arc4 import arc4_signature
from prediction_market import PredictionMarket
import algopy

def build():
    # Compile the contract
    artifact = algopy.compile(PredictionMarket)
    
    # Ensure build directory exists
    build_dir = Path("build")
    build_dir.mkdir(exist_ok=True)
    
    # Write approval and clear programs
    with open(build_dir / "approval.teal", "w") as f:
        f.write(artifact.approval_program)
        
    with open(build_dir / "clear.teal", "w") as f:
        f.write(artifact.clear_program)
        
    # Write ARC4 contract description (ABI)
    with open(build_dir / "contract.json", "w") as f:
        f.write(artifact.arc4_contract.to_json())

    print(f"Build complete. Artifacts in {build_dir.absolute()}")

if __name__ == "__main__":
    build()
